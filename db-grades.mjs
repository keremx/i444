import { AppError, CourseGrades } from 'course-grades';

import mongo from 'mongodb';
import assert from 'assert';

//use in mongo.connect() to avoid warning
const MONGO_CONNECT_OPTIONS = { useUnifiedTopology: true };

const GRADES_COLLECTION = 'grades';

export default class DBGrades {
  constructor(props) {
    //@TODO
    // BURAYA BAK !!!!
    Object.assign(this, props);
  }

  //factory method
  static async make(dbUrl) {
    //@TODO
  try {
      const client = await mongo.connect(dbUrl, MONGO_CONNECT_OPTIONS);
      const db = client.db();
      const grades = db.collection(GRADES_COLLECTION);
      return new DBGrades({client,grades,db});  //@TODO: add suitable args
  }
  catch (err) {
      return errors('DB', err.toString());
    }
  }


  /** Release all resources held by this instance.
   *  Specifically, close any database connections.
   */
  async close() {
    //@TODO
    try {
      await this.client.close();
    }
    catch (err) {
      return errors('DB', err.toString());
    }
  }

  
  /** set all grades for courseId to rawGrades */
  async import(courseInfo, rawGrades) {
    //@TODO
    try {
    
	    const new_grades = new CourseGrades(courseInfo, rawGrades);
	    await this.grades.insertOne( new_grades,{$set: {_id: courseInfo.id}},{upsert: true});
    }
    catch (err) {
      const msg = `Failed To Import ${courseInfo.id}: ${err}`;
      return { errors: [ new AppError(msg, { code: 'BAD_VAL',widget: 'courseId'} ) ] };
    }
  }

  /** add list of [emailId, colId, value] triples to grades for 
   *  courseId, replacing previous entries if any.
   */
  async add(courseInfo, triples) {
    //@TODO
    const grades_from_raw = await this.raw(courseInfo);
    const new_grades = new CourseGrades(courseInfo, grades_from_raw);
    const newTable = new_grades.add(triples);
    this.grades.drop();
    await this.grades.insertOne( newTable,{$set: {_id: courseInfo.id}},{upsert: true});
   
    
  }

  /** Clear out all courses */
  async clear() {
    //@TODO
    //await this.db.drop();
    await this.grades.drop();
  }
  
  /** return grades for courseId including stats.  Returned
   *  grades are filtered as per options.selectionSpec and
   *  projected as per options.projectionSpec.
   */
  async query(courseInfo, options) {
    //@TODO
    const res=await this.raw(courseInfo);
    const new_grades = new CourseGrades(courseInfo,res);
    const selection=Object.values(options.selectionSpec);
    const projection=Object.values(options.projectionSpec);
    const{ rowAggregates, statColId,colAggregates}=new_grades._courseInfo;
    
    let table=new_grades._grades;

    for (const rowAggregate of rowAggregates){
      table=addRowAggregate(table,rowAggregate);
    }
    // for (const colAggregate of colAggregates){
     // table=addColAggregate(table,colAggregate);
   // }
    const select=selectRows(table,selection);
    const project=projectCols(select,projection);

    return project;
}
  /** return raw grades without stats for courseId */
  async raw(courseInfo) { 
    //@TODO
    
     try {
      const result = await this.grades.findOne({_courseId: courseInfo.id});
      return result._grades;
    }
    catch (err) {
      //return errors('DB', err.toString());
      const msg = `unknown course ${courseInfo.id}: ${err}`;
      return { errors: [ new AppError(msg, { code: 'BAD_VAL',widget: 'courseId'} ) ] };
    }  
    
    
  }

}
function add(triples) {
    const errors = [];
    const emailUpdates = {};
    for (const triple of triples) {
      const validation = this._validate(triple);
      if (validation.errors) {
	errors.push(...validation.errors);
      }
      else {
	const [emailId, colId, value] = triple;
	emailUpdates[emailId] ??= {};
	emailUpdates[emailId][colId] = value;
      }
    }
    if (errors.length > 0) {
      return { errors };
    }
    else {
      let rows = [];
      for (const row of this._grades) {
	const { emailId } = row;
	rows.push({ ...row, ...(emailUpdates[emailId] || {})});
      }
      return CourseGrades._make(this._courseInfo, rows);
    }
 }
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

function checkIds(idTypes, selectionSpec, projectionSpec) {
  const errors = [];
  for (const id of [ ...Object.keys(selectionSpec), ...projectionSpec ]) {
    if (!idTypes[id]) {
      errors.push(new AppError(`unknown id "${id}"`, { code: 'BAD_ID' }));
    }
  }
  return errors;
}
function addColAggregate(table, statColId, colAggregate, idTypes) {
  const { aggregateId, aggregateFn } = colAggregate;
  const ret = [ ...table ];
  const statIds = Object.keys(idTypes).filter(id => idTypes[id] === 'num');
  const statRow = { [statColId]: aggregateId };
  const nonRowStatsTable = table.filter(row => !row[statColId]);
  for (const id of statIds) {
    const col = colVec(nonRowStatsTable, id);
    statRow[id] = aggregateFn(col);
  };
  ret.push(statRow);
  return ret;
}

function addStatCol(table, statColId, idTypes) {
  const ret = [];
  for (const row of table) {
    ret.push({[statColId]: '', ...row});
  }
  idTypes[statColId] = 'str';
  return ret;
}


function addRowAggregate(table, rowAggregate) {
  const { aggregateId, filters = [], aggregateFn } = rowAggregate;
  const ret = [];
  let idType = 'num';
  for (const row of table) {
    let filtered = row;
    for (const filter of filters) {
      filtered = filter(filtered);
    }
    const aggregate = aggregateFn(filtered);
    if (typeof aggregate !== 'number') idType = 'str';
    ret.push({...row, [aggregateId]: aggregate});
  }
  
  return ret;
}


function selectRows(table, selections) {
  let selTable = table;
  for (const [k, v] of Object.entries(selections)) {
    const kTable = [];
    for (const row of selTable) {
      if (row[k] === v) kTable.push(row);
    }
    selTable = kTable;
  }
  return selTable;
}

function projectCols(table, colIds) {
  if (colIds.length === 0) return table;
  return table.map(row => {
    let row1 = {};
    colIds.forEach(id => row1[id] = row[id]);
    return row1;
  });
  
  
}

function errors(code, msg) {
  return { errors: [ new AppError(msg, {code}) ] };
}

