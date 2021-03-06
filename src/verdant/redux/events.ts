import { History } from "../../lilgit/model/history";
import { Checkpoint } from "../../lilgit/model/checkpoint";
import { verdantState, artifactState } from "./index";
import { VerCell } from "../../lilgit/components/cell";

const ADD_EVENT = "ADD_EVENT";
const INIT_EVENT_MAP = "INIT_EVENT_MAP";
const UPDATE_CHECKPOINT = "UPDATE_CHECKPOINT";

export const initEventMap = () => ({
  type: INIT_EVENT_MAP
});
export const addEvent = (ev: Checkpoint) => ({
  type: ADD_EVENT,
  event: ev
});

export const updateCheckpoint = (event: Checkpoint) => {
  return {
    type: UPDATE_CHECKPOINT,
    currentEvent: event
  };
};

export type eventState = {
  notebook: number;
  events: Checkpoint[];
};

export type dateState = {
  date: number;
  events: eventState[];
};

export type eventMapState = {
  dates: dateState[];
};

export const eventsInitialState = (): eventMapState => {
  return { dates: [] as dateState[] };
};

export const eventReducer = (
  state: verdantState,
  action: any
): verdantState => {
  switch (action.type) {
    case INIT_EVENT_MAP:
      if (state.dates.length < 1)
        return {
          ...state,
          dates: reducer_initEventMap(state),
          currentEvent: getInitialEvent(state.history),
          cellArtifacts: cellReducer(state.history),
          notebookArtifact: notebookReducer(state.history)
        };
      else return state;
    case UPDATE_CHECKPOINT:
      if (action.currentEvent != state.currentEvent) {
        return {
          // update both event map and current event with new event
          ...state,
          currentEvent: action.currentEvent,
          cellArtifacts: cellReducer(state.history),
          notebookArtifact: notebookReducer(state.history),
          dates: reducer_addEvent(action.currentEvent, state.dates)
        };
      } else return state;
    case ADD_EVENT:
      return {
        ...state,
        dates: reducer_addEvent(action.ev, [...state.dates])
      };
    default:
      return state;
  }
};

export function reducer_addEvent(
  event: Checkpoint,
  dates: dateState[]
): dateState[] {
  let time = event.timestamp;
  let date = dates[dates.length - 1];
  if (!date || !Checkpoint.sameDay(time, date.date)) {
    // new date
    let newEvent: eventState = { notebook: event.notebook, events: [event] };
    let newDate: dateState = { date: time, events: [newEvent] };
    dates.push(newDate);
  } else {
    // existing date
    let lastEvent: eventState = date.events[date.events.length - 1];
    // existing notebook for this date
    if (lastEvent && lastEvent.notebook === event.notebook) {
      lastEvent.events.push(event);
    } else {
      // new notebook for this date
      let newEvent: eventState = { notebook: event.notebook, events: [event] };
      date.events.push(newEvent);
    }
  }
  return dates;
}

function reducer_initEventMap(state: verdantState) {
  let dates = [] as dateState[];
  state.history.checkpoints
    .all()
    .forEach(event => reducer_addEvent(event, dates));
  return dates;
}

function cellReducer(history: History): artifactState[] {
  return history.notebook.cells.map((cell: VerCell) => {
    let name = cell.model.name;
    let output = null;
    let outputVer = 0;
    if (cell.output) {
      output = cell.output.name;
      outputVer = parseInt(output[2]);
    }
    let ver = cell.model.version + 1;

    return { name, ver, outputVer };
  });
}

function notebookReducer(history: History): artifactState {
  let i = history.notebook.model.version;
  let version = parseInt(i) + 1;
  return { name: "", ver: version, file: history.notebook.name };
}

function getInitialEvent(history: History): Checkpoint {
  let checkpoints = history.checkpoints.all();
  return checkpoints[checkpoints.length - 1];
}
