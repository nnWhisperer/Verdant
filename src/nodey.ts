import * as CodeMirror
  from 'codemirror';


import{
  CodeMirrorEditor
} from '@jupyterlab/codemirror';



export
abstract class Nodey
{
  number : number //chronological number
  run : string //id marking which run
  timestamp : Date //timestamp when created
  pendingUpdate : string
  parent : Nodey
  right : Nodey
  left : Nodey

  constructor(options: { [id: string] : any })
  {
    this.number = options.number
    this.run = options.run
    this.timestamp = options.timestamp
  }

}


export
class NodeyOutput extends Nodey
{
  dependsOn: Nodey[]
  raw: {}

  constructor(options: { [id: string] : any })
  {
    super(options)
    this.raw = options // note for different output types, the data is all named differently
    this.dependsOn = (<any> options)['dependsOn']
  }

  static EMPTY()
  {
    return new NodeyOutput({'raw': {}, 'dependsOn': []})
  }
}


export
class NodeyCode extends Nodey
{
  type : string
  output: NodeyOutput[]
  content : NodeyCode[]
  start: {'line' : number, 'ch' : number}
  end: {'line' : number, 'ch' : number}
  literal: any
  marker: CodeMirror.TextMarker

  constructor(options: { [id: string] : any })
  {
    super(options)
    this.type = options.type
    this.content = options.content
    this.output = (<any> options)['output']
    this.literal = options.literal
    this.start = options.start
    this.end = options.end
  }

  static EMPTY()
  {
    return new NodeyCode({'type': 'EMPTY', 'content': []})
  }
}


/**
 * A namespace for Nodey statics.
 */
export
namespace Nodey {

  export
  function dictToCodeNodeys(dict: { [id: string] : any }) : NodeyCode
  {
    //console.log("DICT IS", dict)
    var n = new NodeyCode(dict)
    n.content = []
    for(var item in dict.content)
    {
      var content = dict.content[item] // convert the coordinates of the range to code mirror style
      content.start = {'line': content.start.line - 1, 'ch': content.start.ch}
      content.end = {'line': content.end.line - 1, 'ch': content.end.ch}
      var child = dictToCodeNodeys(dict.content[item])
      child.parent = n
      child.left = n.content[Math.max(n.content.length - 1, 0)]
      if(child.left)
        child.left.right = child
      n.content.push(child)
    }
    return n
  }

  export
  function placeMarkers(nodey : NodeyCode, editor : CodeMirrorEditor) : void
  {
    if(nodey.literal) //if this node is has shown concrete text
    {
      var div = document.createElement('div')
      div.classList.add('verd-marker')
      nodey.marker = editor.doc.markText(nodey.start, nodey.end, {'css': 'background-color: pink'})
    }
    for(var i in nodey.content)
      this.placeMarkers(nodey.content[i], editor)
  }
}
