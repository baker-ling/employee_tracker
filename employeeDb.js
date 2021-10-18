/**
 * @module ./employeeDb
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * @typedef {Object} roleData
 * @property {number} [id]
 * @property {string} title
 * @property {number} salary
 * @property {number} department_id
 */

/**
 * @namespace 
 * @property {mysql.Connection} connection - Connection to the MySQL server/database
 */
const employeeDb = {
  
  connection: null,

  async initializeConnection () {
    this.connection = await mysql.createConnection({
      host: 'localhost', 
      user: process.env.DB_USER, 
      password: process.env.DB_PASSWORD,
      database: 'employee_db'
    });
    return this;
  },

  async closeConnection() {
    this.connection && this.connection.end();
  },

  async getDepartments() {
    const [departments] = await this.connection.query('SELECT * FROM department ORDER BY id');
    return departments;
  },

  async getRoles() {
    const [roles] = await this.connection.query(
      `SELECT role.id AS id, title, department.name as department, salary
      FROM role JOIN department WHERE role.department_id = department.id
      ORDER BY role.id`
    );
    return roles;
  },

  async getEmployees() {
    const [employees] = await this.connection.query(
      `SELECT emp.id, emp.first_name, emp.last_name, role.title, department.name AS department, role.salary, COALESCE(CONCAT(mgr.first_name, ' ', mgr.last_name), "") AS manager
      FROM employee emp
      JOIN role ON emp.role_id = role.id
      JOIN department ON role.department_id = department.id
      LEFT JOIN employee mgr ON emp.manager_id = mgr.id
      ORDER BY emp.id`
    );
    return employees;
  },

  /**
   * Gets all roles that a given department has
   * @param {number} department_id 
   * @returns 
   */
  async getRolesByDepartmentId(department_id) {
    const [roles] = await this.connection.query(
      `SELECT * FROM role WHERE department_id = ? ORDER BY id`,
      department_id
    );
    return roles;
  },

  /**
   * Gets all employee records that belong a department
   * @param {number} department_id 
   * @returns 
   */
  async getEmployeesByDepartmentId(department_id) {
    const [employees] = await this.connection.query(
      `SELECT employee.id, employee.first_name, employee.last_name, employee.role_id, employee.manager_id
      FROM employee
      JOIN role ON employee.role_id = role.id
      JOIN department ON role.department_id = department.id
      WHERE department.id = ?
      ORDER BY employee.id`,
      department_id
    );
    return employees;
  },

  /**
   * Adds a department to the database and returns the id of the inserted record
   * @param {string} departmentName 
   * @returns
   */
  async addDepartment(departmentName) {
    const [result] = await this.connection.query(
      `INSERT INTO department (name) VALUES (?)`, departmentName
    );
    return result.insertId;
  },

  /**
   * Adds a new role to the employee database.
   * @param {RoleData} roleData 
   * @returns 
   */
  async addRole(roleData) {
    const {title, salary, department_id} = roleData;
    const [result] = await this.connection.query(
      `INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)`,
      [title, salary, department_id]
    );
    return result.insertId;
  },

  async addEmployee(employeeData) {
    const {first_name, last_name, role_id, manager_id} = employeeData;
    const [result] = await this.connection.query(
      `INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?) `,
      [first_name, last_name, role_id, manager_id]
    );
    return result.insertId;
  },

  async updateEmployeeRole(employeeId, newRoleId) {
    const [result] = await this.connection.query(
      `UPDATE employee SET role_id = ? WHERE id = ?`,
      [newRoleId, employeeId]
    );
    return result.affectedRows;
  }
}

module.exports = employeeDb;