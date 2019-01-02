import {
  Nodey,
  NodeyMarkdown,
  NodeyCode,
  NodeyOutput,
  NodeyCodeCell
} from "../../model/nodey";
import { History } from "../../model/history";
import { Inspect } from "../../inspect";

const INSPECT_VERSION = "v-VerdantPanel-inspect-version";
const INSPECT_VERSION_CONTENT = "v-VerdantPanel-inspect-version-content";
const VERSION_HEADER = "v-VerdantPanel-inspect-version-header";
const VERSION_LINK = "v-VerdantPanel-inspect-version-header-link";

export namespace VersionSampler {
  export function sample(history: History, nodey: Nodey, query?: string) {
    let inspector = history.inspector;
    let text = inspector.renderNode(nodey).text;

    let sample = document.createElement("div");
    sample.classList.add(INSPECT_VERSION);

    let content = document.createElement("div");
    content.classList.add(INSPECT_VERSION_CONTENT);
    sample.appendChild(content);

    if (nodey instanceof NodeyCode)
      buildCode(inspector, nodey, text, content, query);
    else if (nodey instanceof NodeyMarkdown)
      buildMarkdown(inspector, nodey, text, content, query);
    else if (nodey instanceof NodeyOutput)
      buildOutput(inspector, nodey, content, query);

    return sample;
  }

  export function searchHeader(
    history: History,
    nodey: Nodey,
    callback: () => void
  ) {
    let header = document.createElement("div");
    header.classList.add(VERSION_HEADER);
    let spanA = document.createElement("span");
    spanA.textContent = "versions of ";
    let spanB = document.createElement("span");
    spanB.textContent = nameNodey(history, nodey);
    spanB.classList.add(VERSION_LINK);
    spanB.addEventListener("click", callback);
    header.appendChild(spanA);
    header.appendChild(spanB);
    return header;
  }

  function nameNodey(history: History, nodey: Nodey): string {
    let nodeyName: string;
    if (nodey instanceof NodeyMarkdown) nodeyName = "markdown " + nodey.id;
    else if (nodey instanceof NodeyCodeCell)
      nodeyName = "code cell " + nodey.id;
    else if (nodey instanceof NodeyOutput) nodeyName = "output " + nodey.id;
    else if (nodey instanceof NodeyCode) {
      let cell = history.store.getCellParent(nodey);
      nodeyName =
        nodey.type + " " + nodey.id + " from " + nameNodey(history, cell);
    }
    return nodeyName;
  }

  export function verHeader(history: History, nodey: Nodey) {
    // 1 index instead of 0 index just for display
    let ver = nodey.version + 1;
    let created = history.checkpoints.get(nodey.created);
    let notebookVer;
    if (created) notebookVer = created.notebook + 1 + "";
    else notebookVer = "???";

    let header = document.createElement("div");
    header.classList.add(VERSION_HEADER);
    header.textContent = "#" + ver + ", NOTEBOOK #" + notebookVer;
    return header;
  }

  async function buildCode(
    inspector: Inspect,
    nodeyVer: NodeyCode,
    text: string,
    content: HTMLElement,
    query?: string
  ): Promise<HTMLElement> {
    content.classList.add("code");
    await inspector.renderCodeVerisonDiv(
      nodeyVer,
      text,
      content,
      Inspect.CHANGE_DIFF,
      query
    );

    return content;
  }

  async function buildOutput(
    inspector: Inspect,
    nodeyVer: NodeyOutput,
    content: HTMLElement,
    query?: string
  ): Promise<HTMLElement> {
    await inspector.renderOutputVerisonDiv(nodeyVer, content, query);
    return content;
  }

  async function buildMarkdown(
    inspector: Inspect,
    nodeyVer: NodeyMarkdown,
    text: string,
    content: HTMLElement,
    query?: string
  ): Promise<HTMLElement> {
    content.classList.add("markdown");
    await inspector.renderMarkdownVersionDiv(
      nodeyVer,
      text,
      content,
      Inspect.CHANGE_DIFF,
      query
    );

    return content;
  }
}
