import cors from 'cors';
import express from 'express';
import assert from 'assert';
import bodyParser from 'body-parser';
import querystring from 'querystring';

import { CourseGrades, AppError } from 'course-grades';
import getCourseInfo from 'courses-info';

//HTTP status codes
const OK = 200;
const CREATED = 201;
const NO_CONTENT = 204;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;
const SERVER_ERROR = 500;
// grades
export default function serve(port, model, base='') {
  const app = express();
  app.locals.port = port;
  app.locals.base = base;
  app.locals.model = model;
  setupRoutes(app);
  app.listen(port, function() {
    console.log(`listening on port ${port}`);
  });
}


function setupRoutes(app) {
  const base = app.locals.base;
  app.use(cors());
  app.use(bodyParser.json());
  app.get(`${base}/:id/raw/`, doGradesGet(app));
  app.get(`${base}/:id/grades/`, doAllGradesGet(app));
  app.get(`${base}/:id/students/:student_id/`, doStudentsIdGet(app));
  app.patch(`${base}/:id/raw/`, doUpdateRawGrades(app));
  //must be last
  app.use(do404(app));
  app.use(doErrors(app));
  //TODO: set up routes

}

/* Suggested structure for setting up a handler

function handler(app) {
  return (async function(req, res) {
    try {
      ...
      if (someResult.errors) throw someResult;
      ...
      res.status(...) ... res.json(...)
    }
    catch(err) {
      const mapped = mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}
*/

//TODO: define handlers

function doGradesGet(app) {
  return (async function(req, res) {
    try {
      const id= req.param("id")
      const courseInfo = await getCourseInfo(req.param("id"));
      const someResult = await app.locals.model.raw(courseInfo);
      //if (someResult.errors) throw someResult;
      const errors=[]
      if(courseInfo.errors) { 
          const msg = `unkown course"${id}"`;
      	  errors.push(new AppError(msg, { code: 'NOT_FOUND' }));
      	  res.status(404).json(errors)
       
      }
      else{
      res.json(someResult);
      }
    }
    catch(err) {
      const mapped = mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}



function doAllGradesGet(app) {
  return (async function(req, res) {
    try {
      const courseInfo = await getCourseInfo(req.param("id"));
      const someResult = await app.locals.model.query(courseInfo);
       
   
     
      res.json(someResult);
    }
    catch(err) {
      const mapped = mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doStudentsIdGet(app) {
  return (async function(req, res) {
    try {
   
      const courseInfo = await getCourseInfo(req.param("id"));
      const someResult = await app.locals.model.query(courseInfo);
      const id= req.param("student_id")
      let new_table = [];
      for(const row of someResult){
	  for(const [key,value] of Object.entries(row)){
	      if(value === id){
	      	 new_table.push(row)
	      }
	      if(value === "$avg"){
	      	 new_table.push(row)
	      }
	      if(value === "$min"){
	      	 new_table.push(row)
	      }
	      if(value === "$max"){
	      	 new_table.push(row)
	      }
	      if(value === "$count"){
	      	 new_table.push(row)
	      }
	  }      
      
      }
     const errors = [];
     
      if (!new_table[0].hasOwnProperty('emailId')) {
      
          const msg = `cannot find grades for student"${id}"`;
      	  errors.push(new AppError(msg, { code: 'NOT_FOUND' }));
      	  return res.status(404).json(errors)
      }
      res.json(new_table)
      
     
        
      
    }
    catch(err) {
      const mapped = mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doUpdateRawGrades(app) {
  return (async function(req, res) {
    try {
 
      const courseInfo = await getCourseInfo(req.param("id"));
      const someResult = await app.locals.model.add(courseInfo,req.body);
     
      if(someResult.errors){
      	throw someResult;
      }
      res.status(204).json(someResult);
    }
    catch(err) {
      const mapped = mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}


/** Default handler for when there is no route for a particular method
 *  and path.
 */
function do404(app) {
  return async function(req, res) {
    const message = `${req.method} not supported for ${req.originalUrl}`;
    const result = {
      status: NOT_FOUND,
      errors: [	{ options: { code: 'NOT_FOUND' }, message, }, ],
    };
    res.status(404).json(result);
  };
}


/** Ensures a server error results in nice JSON sent back to client
 *  with details logged on console.
 */ 
function doErrors(app) {
  return async function(err, req, res, next) {
    const message = err.message ?? err.toString();
    const result = {
      status: SERVER_ERROR,
      errors: [ { options: { code: 'INTERNAL' }, message } ],
    };
    res.status(SERVER_ERROR).json(result);
    console.error(result.errors);
  };
}

/*************************** Mapping Errors ****************************/

//map from domain errors to HTTP status codes.  If not mentioned in
//this map, an unknown error will have HTTP status BAD_REQUEST.
const ERROR_MAP = {
  EXISTS: CONFLICT,
  NOT_FOUND: NOT_FOUND,
  DB: SERVER_ERROR,
  INTERNAL: SERVER_ERROR,
}

/** Return first status corresponding to first option.code in
 *  appErrors, but SERVER_ERROR dominates other statuses.  Returns
 *  BAD_REQUEST if no code found.
 */
function getHttpStatus(appErrors) {
  let status = null;
  for (const appError of appErrors) {
    const errStatus = ERROR_MAP[appError.options?.code];
    if (!status) status = errStatus;
    if (errStatus === SERVER_ERROR) status = errStatus;
  }
  return status ?? BAD_REQUEST;
}

/** Map domain/internal errors into suitable HTTP errors.  Return'd
 *  object will have a "status" property corresponding to HTTP status
 *  code.
 */
function mapResultErrors(err) {
  const errs = err.errors ?? [ new AppError(err.message ?? err.toString()) ];
  const errors =
    errs.map(err => ({message: err._msg, options: err._options}));
  const status = getHttpStatus(errors);
  if (status === SERVER_ERROR)  console.error(errors);
  return { status, errors, };
} 

