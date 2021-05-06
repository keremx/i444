export default class GradesApp extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }

  /** Called when this element instance has been added/moved
   *  in the DOM.  Will have courseId, courseInfo and
   *  gradesTable properties.
   */
  connectedCallback() {
    const { courseId, courseInfo, gradesTable } = this;
    let html = STYLE;
    //html += `<pre>${JSON.stringify(this, null, 2)}</pre>`;
    // TODO: replace above line which builds out component as per spec.
    var header= Object.keys(Object.values(gradesTable)[0]);
    
    //var header = Object.keys(a);
    var total = "<th>"
    for( var i = 0; i < header.length; i++)
      {
	total += header[i]+"</th>"
    if(i != header.length -1)
     {
        total += "<th>"
     }
    }
    html += `<table class="grades">`
    html += `<tr>`
    html += total;
    html += `</tr>`
    html += `<tr>`
    
    for (var i = 0; i < gradesTable.length; i++){
	 //html += `<th>${Object.keys(Object.values(gradesTable)[i])}</th>`;
	 var content =Object.values(Object.values(gradesTable)[i]);
	 //var header2= Object.keys(Object.values(gradesTable)[i]);
	var total = "<td>"
	for( var j = 0; j < content.length;j++)
	{
	// Burasi bos cell ekleme yeri
	//if(header2[j] === undefined){header[j] =  "<td></td><td></td>"}
	total += content[j]+"</td>"
  	if(j != content.length -1)
  	{
  	total += "<td>"
  	}
        }
	 //html += `<table class="grades">`
	 html += `<tr>`
	 html += total;
	 html += `</tr>`
    }
    console.log(html);
    
    //html += `</tr>`
    html += `</table>`
  // for (var i = 0; i < 5; i++) {
   //	html += `<h2>${gradesTable[i].emailId}<h2>`;
   //}
   //html +=${courseInfo.name}</h2>
    html += `<table class="grades">`;
    this.shadowRoot.innerHTML = html;
    
    
  }

  /** Called when this element instance is removed from the DOM.
   */
  disconnectedCallback() {
  }

}


const STYLE = `
<style>
.grades {
  margin: 10px;
  border-collapse: collapse;
}

.grades td {
  background-color: lightcyan;
  text-align: right;
}

.grades th {
  background-color: paleturquoise;
  font-weight: bold;
  text-align: center;
}
.grades td,
.grades th {
  min-width: 40px;
  pointer: default;
  border: 1px solid gray;
}

.grades tr:hover {
  background-color: aquamarine;
}
.grades tr:hover td {
  background-color: transparent;
}
</style>
`;
