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
    const url = `${this.url}/${courseId}/grades`;
    return await doGet(url, queryParams);
  }

  /** Make a `GET` request to /:courseId/raw?queryParams.
   *  Return success object or object having an errors
   *  property.
   */
  async raw(courseId, queryParams) {
    // TODO
    const url = `${this.url}/${courseId}/raw`;
    return await doGet(url, queryParams);
  }

  /** Make a `GET` request to
   *  /:courseId/students/:studentId?queryParams.  Return success
   *  object or object having an errors property.
   */
  async student(courseId, studentId, queryParams) {
    // TODO
    const url = `${this.url}/${courseId}/students/${studentId}`;
    return await doGet(url, queryParams);
  }

  /** Make a `PATCH` request to /courseId/raw?queryParams passing
   *  updates as request body.  Return success object or object having
   *  an errors property.
   */
  async update(courseId, queryParams, updates) {
    // TODO
    const url = `${this.url}/${courseId}/raw`;
    return await doNonGet(url, 'PATCH', queryParams, updates);
  }
  
}

