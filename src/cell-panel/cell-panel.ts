import { Widget } from "@phosphor/widgets";

import { NodeyCell } from "../nodey";

import { HistoryModel } from "../history-model";

import { InspectWidget } from "../inspector/inspect-widget";

const CELL_PANEL = "v-VerdantPanel-cellPanel";
const CELLHEADER_CLASS = "v-VerdantPanel-runList-header";
const RUN_LABEL = "v-VerdantPanel-runList-runDateTotal";
const CELLHEADER_CARET = "v-VerdantPanel-runList-caret";
const CELL_CONTAINERS = "v-VerdantPanel-cellList-container";
const CELLS_UL = "v-VerdantPanel-runList-ul";
const CELL_LI = "v-VerdantPanel-cellList-li";
const CELL_VER_COUNT = "v-VerdantPanel-cellList-versionNumber";
const CELL_TYPE = "v-VerdantPanel-cellList-cellType";
const CELL_SAMPLE = "v-VerdantPanel-cellList-sample";

/**
 * A widget which displays cell-level history information
 */
export class CellPanel extends Widget {
  inspectWidget: InspectWidget;
  historyModel: HistoryModel;

  constructor(historyModel: HistoryModel) {
    super();
    this.addClass(CELL_PANEL);
    this.historyModel = historyModel;
    this.inspectWidget = new InspectWidget(historyModel);
    this.node.appendChild(this.inspectWidget.node);

    let currentCells = this.buildCellHeader();
    this.node.appendChild(currentCells);
    let cellContent = document.createElement("div");
    cellContent.classList.add(CELL_CONTAINERS);
    this.node.appendChild(cellContent);
    let deletedCells = this.buildDeleteHeader();
    let deletedContent = document.createElement("div");
    deletedContent.classList.add(CELL_CONTAINERS);
    this.node.appendChild(deletedCells);
    this.node.appendChild(deletedContent);

    this.historyModel.inspector.ready.then(async () => {
      await this.historyModel.notebook.ready;
      this.updateCellDisplay(null, null);
      this.historyModel.inspector.cellStructureChanged.connect(
        this.updateCellDisplay.bind(this)
      );
    });
  }

  hide() {
    super.hide();
    this.inspectWidget.hide();
  }

  show() {
    super.show();
    this.inspectWidget.show();
  }

  get cellCaret() {
    return this.node.getElementsByClassName(CELLHEADER_CARET)[0] as HTMLElement;
  }

  get deleteCaret() {
    return this.node.getElementsByClassName(CELLHEADER_CARET)[1] as HTMLElement;
  }

  get cellListContainer() {
    return this.node.getElementsByClassName(CELL_CONTAINERS)[0] as HTMLElement;
  }

  get deletedListContainer() {
    return this.node.getElementsByClassName(CELL_CONTAINERS)[1] as HTMLElement;
  }

  updateCellDisplay(sender: any, cell: [number, NodeyCell]) {
    // OPTIMIZE: don't rebuild the cell list every time!
    console.log("UPDATE CELL DISPLAY");
    let cellCount = this.historyModel.cellIndices.length;
    let deletedCount = this.historyModel.deletedCellIndices.length;

    let labels = this.node.getElementsByClassName(RUN_LABEL);
    labels[0].textContent = "Current Cells (" + cellCount + ")";
    labels[1].textContent = "Deleted Cells (" + deletedCount + ")";

    let cellContainers = this.node.getElementsByClassName(CELL_CONTAINERS);
    cellContainers[0].innerHTML = "";
    cellContainers[0].appendChild(this.buildCellList());
  }

  buildCellList(): HTMLElement {
    let cellContainer = document.createElement("div");
    cellContainer.classList.add(CELLS_UL);

    var cells = this.historyModel.cellList;
    cells.forEach(cell => {
      let listItem = document.createElement("div");
      listItem.classList.add(CELL_LI);

      let versionCount = this.historyModel.getVersionsFor(cell).versions.length;
      let versionLabel = document.createElement("div");
      let versions = "version";
      if (versionCount > 1) versions = "versions";
      versionLabel.textContent = versionCount + " " + versions;
      versionLabel.classList.add(CELL_VER_COUNT);
      listItem.appendChild(versionLabel);

      let cellType = document.createElement("div");
      cellType.classList.add(CELL_TYPE);
      cellType.textContent = cell.typeName;
      listItem.appendChild(cellType);

      let sample = document.createElement("div");
      sample.classList.add(CELL_SAMPLE);
      sample.classList.add(cell.typeName);
      sample.textContent = this.historyModel.inspector.sampleNode(cell);
      if (cell.typeName === "markdown")
        this.historyModel.inspector.renderBaby.renderMarkdown(
          sample,
          sample.textContent
        );
      listItem.appendChild(sample);

      cellContainer.appendChild(listItem);
    });
    return cellContainer;
  }

  buildCellHeader(): HTMLElement {
    let header = document.createElement("div");
    header.classList.add(CELLHEADER_CLASS);
    header.classList.add("cells");

    let tag = document.createElement("div");
    tag.textContent = "Current cells (?)";
    tag.classList.add(RUN_LABEL);

    let caret = document.createElement("div");
    caret.classList.add(CELLHEADER_CARET);
    caret.addEventListener("click", this.toggleCellList.bind(this));

    header.appendChild(tag);
    header.appendChild(caret);

    return header;
  }

  buildDeleteHeader(): HTMLElement {
    let header = document.createElement("div");
    header.classList.add(CELLHEADER_CLASS);
    header.classList.add("cells");

    let tag = document.createElement("div");
    tag.textContent = "Deleted cells (?)";
    tag.classList.add(RUN_LABEL);

    let caret = document.createElement("div");
    caret.classList.add(CELLHEADER_CARET);
    caret.classList.add("closed");
    caret.addEventListener("click", this.toggleDeleteList.bind(this));

    header.appendChild(tag);
    header.appendChild(caret);

    return header;
  }

  toggleCellList() {
    let caret = this.cellCaret;
    if (caret.classList.contains("closed")) {
      caret.classList.remove("closed");
      this.cellListContainer.style.display = "";
    } else {
      caret.classList.add("closed");
      this.cellListContainer.style.display = "none";
    }
  }

  toggleDeleteList() {
    let caret = this.deleteCaret;
    if (caret.classList.contains("closed")) {
      caret.classList.remove("closed");
      this.deletedListContainer.style.display = "";
    } else {
      caret.classList.add("closed");
      this.deletedListContainer.style.display = "none";
    }
  }
}