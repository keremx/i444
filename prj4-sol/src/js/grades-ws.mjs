import jsUtils from 'cs544-js-utils';
const { AppErrors } = jsUtils;

export default class GradesWs {
  constructor(url) {
    this.url = url;
  }

  /** Make a `GET` request to /:courseId/grades?queryParams.
   *  Return success object or object having an errors
   *  property.
   */
  async grades(courseId, queryParams) {
    // TODO
    
      try {
      ///${queryParams}
      const qparams= new URLSearchParams(queryParams);
      const response = await fetch(`${this.url}/${courseId}/grades/?${qparams}`);
      
      //return await responseResult(response);
      return await response.json();
    }
    catch (err) {
      return new AppErrors().add(err);
    }
    
  }

  /** Make a `GET` request to /:courseId/raw?queryParams.
   *  Return success object or object having an errors
   *  property.
   */
  async raw(courseId, queryParams) {
    // Not required for this project.
    return null;
  }

  /** Make a `GET` request to
   *  /:courseId/students/:studentId?queryParams.  Return success
   *  object or object having an errors property.
   */
  async student(courseId, studentId, queryParams) {
    // TOD
    try {
	    const qparams= new URLSearchParams(queryParams);
	    const response = await fetch(`${this.url}/${courseId}/students/${studentId}/?${qparams}`);
	    //return `dummy ${studentId} student grades for "${courseId}"`;
	    return await response.json()
    }
    catch (err) {
      return new AppErrors().add(err);
      }
}
  

  /** Make a `PATCH` request to /courseId/grades?queryParams passing
   *  updates as request body.  Return success object or object having
   *  an errors property.
   */
  async update(courseId, queryParams, updates) {
    // Not required for this project.
    return null;
  }
  
}


  

  
