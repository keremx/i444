import { AppError } from './util.mjs';


/** A grades table consists of a list of row objects.  Each row object
 *  will represent the grades for a student or a statistic like
 *  average over all students.  Each row object will have properties
 *  like `emailId` identifying the student and `section` identifying
 *  the section the student is registered for.  It will also have
 *  properties like 'prj1', 'hw1', etc. specifying the grades recorded
 *  for the student.    It may also have properties for derived statistics
 *  information for that row.
 */
export default class Grades {

  //private constructor: not to be used outside this class
  constructor(grades) {
    this._grades = grades;
    this._precomputed = {}; //cache for precomputed grades + stats
  }

  /**
   * Expecting grades to be an object containing at least a
   * 'coursesGrades' property set up as follows:
   *
   *     { 'coursesGrades': { COURSE_ID: GRADES_TABLE } }
   *
   * COURSE_ID will be an id like 'cs544' identifying a course and
   * GRADES_TABLE is a grades table as documented above.  GRADES_TABLE
   * only contains raw grades, it does not contain any derived
   * statistics information.  The col-id's for each row in grades
   * table will depend on COURSE_ID.
   */
  static make(grades) {
    return new Grades(grades);
  }

  /** Return an object { COURSE_ID: XGRADES_TABLE } for courseId.  The
   *  returned XGRADES_TABLE is the raw grades data enhanced with
   *  stats documented for COURSE_ID with rows filtered by the
   *  options.selectionSpec object and projected according to the
   *  column id's specified in the options.projectionSpec list.
   *  Specifically, if options.selectionSpec is non-empty only those
   *  rows whose colId-values match all the colId-value mappings in
   *  options.selectionSpec will be returned; if options.selectionSpec
   *  is empty all rows are returned. If options.projectionSpec is
   *  non-empty only those columns whose col-id's match some entry in
   *  options.projectionSpec will be returned; if
   *  options.projectionSpec is empty all columns are returned.
   *
   *  If errors are detected, then the returned object must have
   *  an error property set to a list of error objects, such that
   *  calling toString() on an error object returns a suitable 
   *  error message.
   *
   *  An unknown courseId or an unknown colId in either
   *  options.projectionSpec or options.selectionSpec should result in
   *  an error.
   */
  query(courseId, options={}) {
    const { projectionSpec=[], selectionSpec={} } = options;
    //console.log(options.selectionSpec);
    //console.log(options.projectionSpec);
    let grades_object= this._grades.coursesGrades[courseId]
    
    let new_table =[]
    
    for (const row of grades_object) {
    	let new_object={}
    	
    	for (const [key, val] of (Object.entries(row))) {
  	     new_object[key]=val
  	}
  	//new_table.push(new_object)
  	new_object["$pAvg"]=0
  	new_object["$hAvg"]=0
  	new_object["$qAvg"]=0
  	new_object["$total"]=0
  	new_table.push(new_object)   
   }
    
   // new_table.unshift({ key: 'a', value: 1 })
   
   
    
    
    for (let i = 0; i < 10; i++) {
        let total_prj_points=[]
        for (let k = 0; k < 5; k++) {
             let a = k+2
	     total_prj_points.push(Object.values(Object.values(grades_object)[i])[a])
	     }
	total_prj_points.sort()
	total_prj_points.shift()
	let avgpoint_prj= avgStat(total_prj_points)
	new_table[i]["$pAvg"]=avgpoint_prj
	//prj
	let total_hw_points=[]
	for (let k = 0; k < 4; k++) {
             let a = k+7
	     total_hw_points.push(Object.values(Object.values(grades_object)[i])[a])
	     }
	     	total_hw_points.sort()
	total_hw_points.shift()
	let avgpoint_hw= avgStat(total_hw_points)

	new_table[i]["$hAvg"]=avgpoint_hw
	// hw
	let total_qu_points=[]
	for (let k = 0; k < 3; k++) {
             let a = k+14
	     total_qu_points.push(Object.values(Object.values(grades_object)[i])[a])
	     }
	     	total_qu_points.sort()
	total_qu_points.shift()
	let avgpoint_qu= avgStat(total_qu_points)
	new_table[i]["$qAvg"]=avgpoint_qu
	//quiz
	
	let total_points=[]
	let total_avg_points=[]
	for (let k = 0; k < 3; k++) {
             let a = k+17
             //console.log(grades_object[i])
	     total_points.push(Object.values(Object.values(new_table)[i])[a])
	     //console.log("totalpoint ekle= "+total_points)
	     }
	for (let k = 0; k < 3; k++) {
             let a = k+11
	     total_points.push(Object.values(Object.values(grades_object)[i])[a])
	     //console.log("totalpoint ekle= "+total_points)
	     }
	//console.log(total_points)
	let prj_total=(total_points[0]*35)/100
	//console.log("prj total is = "+prj_total)
	let qu_total=(total_points[2]*12)/12
	////console.log("qu total is = "+qu_total)
	let mid_total=(total_points[3]*13)/100
	//console.log("mid total is = "+mid_total)
	let fin_total=(total_points[4]*15)/100
	//console.log("fin total is = "+fin_total)
	let hw_total=0
	let pap_total=0
	if (new_table[i]["section"]="cs544"){
		   hw_total=(total_points[1]*22)/100
		   //console.log("hw total is = "+hw_total)
		   pap_total=(total_points[5]*3)/3
		   //console.log("pap total is = "+pap_total)
	}else if (new_table[i]["section"]="cs444"){
		   hw_total=(total_points[1]*25)/100
		   //console.log("hw total is = "+hw_total)
		   pap_total=0
		   //console.log("pap total is = "+pap_total)
	}
	
	

	
	
	let total_total= prj_total +  hw_total + qu_total  + mid_total + fin_total + pap_total
	new_table[i]["$total"]=total_total
	//total
    }    


   
    if (Object.keys(selectionSpec).length == 0){
    	console.log(new_table)
    }
    const selection_object = Object.values(options.selectionSpec)
    const projection_object = Object.values(options.projectionSpec)
  
    for (let i = 0; i < 10; i++) {
    
        if (Object.values(Object.values(new_table)[i])[0]== selection_object[0]){
            //console.log("emailId is below")
    	    console.log(Object.values(Object.values(new_table)[i])[0])
    	for (let j = 0; j < 19; j++) {
	    	    let a = j+2
	    	    let b = j  
	    	    let c = j+3	    	  
	    	    let d = j+1
	    	    
	    	    for (let k = 0; k < 10; k++) {
		    	    if (Object.keys(Object.values(new_table)[i])[a]== projection_object[k]){
		    	        console.log(Object.values(Object.values(new_table)[i])[a])
				  
				}
	           }
            }
       }
       
    }


  //@TODO: add code as required
    return {[courseId]: []};
}
}


//@TODO: add code as required


//Value to be ignored when computing stats
//use for ignoring dropped grades for row stats or '' entries
//for col entries.
const IGNORE = '$IGNORE';  

/** Return average of all numbers in vals, ignoring all values set to
 *  IGNORE and treating all remaining non-numeric values as 0.
 */
function avgStat(vals) {
  const goodVals = vals.filter(v => v !== IGNORE);
  const sum = goodVals.reduce((acc, e) => acc + numVal(e), 0);
  const count = goodVals.length;
  return (count === 0) ? 0 : Number((sum/count).toFixed(1));    
}


/** Return max of all numbers in vals, ignoring all values set to
 *  IGNORE and treating all remaining non-numeric values as 0.
 */
function maxStat(vals) {
  const goodVals = vals.filter(v => v !== IGNORE);
  return (goodVals.length===0) ? 0 : Math.max(...goodVals.map(v => numVal(v)));
}

/** Return min of all numbers in vals, ignoring all values set to
 *  IGNORE and treating all remaining non-numeric values as 0.
 */
function minStat(vals) {
  const goodVals = vals.filter(v => v !== IGNORE);
  return (goodVals.length===0) ? 0 : Math.min(...goodVals.map(v => numVal(v)));
}

/** Return count of all numbers in vals, ignoring all values set to
 *  IGNORE and treating all remaining non-numeric values as 0.
 */
function countStat(vals) {
  const goodVals = vals.filter(v => v !== IGNORE);
  return goodVals.length;
}

function numVal(v) {
  return (typeof v === 'number') ? v : 0;
}

/** For each column in table, guess it's type based on the contained
 *  data: 'num' if all data is numeric or ''; 'str' otherwise.
 *  Return object mapping col-id to `num` or `str`.
 *
 *  [Only columns with type set to `num` will participate in
 *  course-wide col-stats].
 */
function makeIdTypes(table) {
  const idTypes = {};
  for (const row of table) {
    for (const [id, val] of (Object.entries(row))) {
      const type = (val === '' || typeof val === 'number') ? 'num' : 'str';
      const type1 = idTypes[id] === 'str' ? 'str' : type;
      idTypes[id] = type1;
    }
  }
  return idTypes;
}

/** Verify that all col-ids in selectionSpec and projectionSpec
 *  are valid.  Return list of errors (returned list empty if
 *  no errors).
 */ 
function checkIds(idTypes, selectionSpec, projectionSpec) {
  const errors = [];
  const derivedIds = new Set(Object.values(DERIVED_IDS));
  for (const id of [ ...Object.keys(selectionSpec), ...projectionSpec ]) {
    if (!idTypes[id] && !derivedIds.has(id)) {
      errors.push(new AppError(`unknown id ${id}`, { code: 'BAD_ID' }));
    }
  }
  return errors;
}

//Names of derived ids.
const DERIVED_IDS = {
  //column headings for row stats
  projectsAvg: '$pAvg',
  homeworkAvg: '$hAvg',
  quizzesAvg: '$qAvg',
  total: '$total',
  //row headings for col stats
  colAvg: '$avg',
  colMax: '$max',
  colMin: '$min',
  colCount: '$count',
  stats: '$stats',    //column heading for row stats headings
};

//formulas for computing CS 544 totals based on section.
const CS544_TOTALS = {

  cs444: r =>   1.00*r[DERIVED_IDS.quizzesAvg]
              + 0.35*r[DERIVED_IDS.projectsAvg]
              + 0.25*r[DERIVED_IDS.homeworkAvg]
              + 0.13*numVal(r.mid) 
              + 0.15*numVal(r.fin),

  cs544: r =>   1.00*r[DERIVED_IDS.quizzesAvg]
              + 0.35*r[DERIVED_IDS.projectsAvg]
              + 0.22*r[DERIVED_IDS.homeworkAvg]
              + 1.00*numVal(r.pap) 
              + 0.13*numVal(r.mid) 
              + 0.15*numVal(r.fin),
};

//compute total for row based on syllabus weights; presupposes that
//other row stats have already been computed.
function cs544Total(row) {
  const total = CS544_TOTALS[row.section](row);
  return Number(total.toFixed(1));
}
