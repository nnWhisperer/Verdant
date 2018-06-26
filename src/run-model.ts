import { Run, CellRunData, RunDateList } from "./run";
import { NodeyCell, NodeyCode } from "./nodey";
import { Signal } from "@phosphor/signaling";
import { HistoryModel } from "./history-model";
import { serialized_Run } from "./file-manager";

/*
*
*/
export class RunModel {
  private _runList: Run[];
  private _historyModel: HistoryModel;
  private _newRun = new Signal<this, Run>(this);
  private _dateList: RunDateList[];

  constructor(historyModel: HistoryModel) {
    this._runList = [];
    this._dateList = [];
    this._historyModel = historyModel;
  }

  public getRun(id: number): Run {
    return this._runList[id];
  }

  get runList() {
    return this._runList;
  }

  get runDateList() {
    return this._dateList;
  }

  get newRun(): Signal<RunModel, Run> {
    return this._newRun;
  }

  onRunStarted(execCount: number, nodey: NodeyCell) {
    // TODO
  }

  cellRun(execCount: number, nodey: NodeyCell) {
    if (execCount === null) this.onRunStarted(execCount, nodey);
    else {
      console.log("Cell run!", execCount, nodey);
      var runID = this._runList.length;
      var timestamp = Date.now();
      this._historyModel.commitChanges(nodey, runID);
      //this._historyModel.dump();
      var run = this.recordRun(
        runID,
        timestamp,
        this._historyModel.getNodeyCell(nodey.id)
      );
      console.log("Run committed ", run);
      this._newRun.emit(run);
    }
  }

  private recordRun(runId: number, timestamp: number, nodey: NodeyCell) {
    var cellDat: CellRunData[] = [];
    this._historyModel.cellList.forEach(cell => {
      var dat = {
        node: cell.name,
        changeType: cell.cell.status
      } as CellRunData;
      if (cell.id === nodey.id) {
        dat["run"] = true;
        console.log("cell is", cell);
        if (cell instanceof NodeyCode) {
          var out = cell.getOutput(runId);
          console.log("cell is", cell, "found output", out);
          if (out) dat["newOutput"] = out;
        }
      }
      cellDat.push(dat);
      cell.cell.clearStatus();
    });

    var run = new Run(timestamp, cellDat, runId);
    this._runList[runId] = run;
    this.categorizeRun(run);
    this._historyModel.fileManager.writeToFile(
      this._historyModel.notebook,
      this._historyModel
    );
    return run;
  }

  private categorizeRun(run: Run) {
    var today = this.dateNow();
    var latestDate = this._dateList[Math.max(this._dateList.length - 1, 0)];
    if (!latestDate || latestDate.date !== today) {
      var todaysRuns = new RunDateList(today, [], this);
      this._dateList.push(todaysRuns);
    } else var todaysRuns = latestDate;
    todaysRuns.addRun(run);
  }

  private dateNow(): Date {
    var d = new Date();
    d.setHours(12, 0, 0); // set to default time since we only want the day
    return d;
  }

  public toJSON(): serialized_Run[] {
    return this._runList.map(run => {
      return { run: run.id, timestamp: run.timestamp, cells: run.cells };
    });
  }
}
