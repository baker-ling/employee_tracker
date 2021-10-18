const inquirer = require('inquirer');
const mysql = require('mysql2/promise');
const cTable = require('console.table');
const employeeDb = require('./employeeDb');
const { getRolesByDepartmentId, updateEmployee } = require('./employeeDb');
require('dotenv').config();

async function displayMainPrompt() {
  while (true) {
    const {action} = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        {name: 'View all departments',    value: viewDepartments },
        {name: 'View all roles',          value: viewRoles },
        {name: 'View all employees',      value: viewEmployees },
        {name: 'Add a department',        value: addDepartment },
        {name: 'Add a role',              value: addRole },
        {name: 'Add an employee',         value: addEmployee },
        {name: 'Update an employee role', value: updateEmployeeRole },
        {name: 'Quit',                    value: endProgram }
      ],
      loop: false
    }]);
    await action();
  }
}

/**
 * Shows all the departments in the database
 */
async function viewDepartments() {
  try {
    const departments = await employeeDb.getDepartments();
    console.log('');
    console.table('Departments', departments);
  } catch (err) {
    console.log('An error occurred retrieving information from the database')
    console.error(err);
  }
}


/**
 * Shows all the roles in the database
 */
async function viewRoles() {
  try {
    const roles = await employeeDb.getRoles();
    console.log('');
    console.table('Roles', roles);
  } catch (err) {
    console.log('An error occurred retrieving information from the database')
    console.error(err);
  }
}

/**
 * Shows all the employees in the database
 */
async function viewEmployees() {
  try {
    const employees = await employeeDb.getEmployees();
    console.log('');
    console.table('Employees', employees);
  } catch (err) {
    console.log('An error occurred retrieving information from the database')
    console.error(err);
  }
}

/**
 * Prompts to add a new department to the database
 */
async function addDepartment() {
  const {name} = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'What is the name of the department?',
      validate: input => {
        if (input.trim().length === 0) return "You must enter a department name.";
        if (input.trim().length > 30) return "Department names may not exceed 30 characters.";
        return true;
      },
      filter: input => input.trim()
    }
  ]);
  try {
    const departmentId = await employeeDb.addDepartment(name);
    if (departmentId) {
      console.log(`${name} registered.`);
    }
  } catch (err) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        console.log(`A department already exists with that name.`);
        break;
      default:
        console.log('An error registering the new department in the database.');
        console.error(err);
        break;
    }
    
  }
}

/**
 * Prompts to add a new role to the employee database.
 */
async function addRole() {
  const departments = await employeeDb.getDepartments();
  const roleData = await inquirer.prompt([
    {
      type: 'list',
      name: 'department_id',
      message: 'Which department does the role belong to?',
      choices: departments.map(department => {return {name: department.name, value: department.id}}),
    },
    {
      type: 'input',
      name: 'title',
      message: 'What is the name of the role?',
      validate: input => {
        if (input.trim().length === 0) return "You must enter a name for the role.";
        if (input.trim().length > 30) return "Role names may not exceed 30 characters.";
        return true;
      },
      filter: input => input.trim()
    },
    {
      type: 'number',
      name: 'salary',
      message: 'What is the salary for the role?'
    }
  ]);
  try {
    const roleId = employeeDb.addRole(roleData);
    if (roleId) {
      console.log(`${roleData.title} registered.`);
    }
  } catch (err) {
    console.error('There was an error adding the role to the database.');
    console.error(err);
  }
}

/**
 * Prompts to add a new employee to the employee database.
 */
async function addEmployee() {
  const departments =  await employeeDb.getDepartments();
  // prompt for employee name and department
  let employeeData = await inquirer.prompt([
    {
      type: 'input',
      name: 'first_name',
      message: `What is the employee's first name?`,
      validate: input => {
        if (input.trim().length === 0) return "You must enter a first name.";
        if (input.trim().length > 30) return "First names may not exceed 30 characters.";
        return true;
      },
      filter: input => input.trim()
    },
    {
      type: 'input',
      name: 'last_name',
      message: `What is the employee's last name?`,
      validate: input => {
        if (input.trim().length === 0) return "You must enter a last name.";
        if (input.trim().length > 30) return "Last names may not exceed 30 characters.";
        return true;
      },
      filter: input => input.trim()
    },
    {
      type: 'list',
      name: 'department_id',
      message: `What department does the employee belong to?`,
      choices: departments.map(department => {return {name: department.name, value: department.id}})
    }
  ]);

  // construct choices for roles and managers based on department selection
  const roles = await employeeDb.getRolesByDepartmentId(employeeData.department_id);
  const roleChoices = roles.map(role => {return {name: role.title, value: role.id}});
  
  const employeesInDept = await employeeDb.getEmployeesByDepartmentId(employeeData.department_id);
  const managerChoices = employeesInDept.map(emp => {return {name: emp.first_name + ' ' + emp.last_name, value: emp.id};});
  managerChoices.unshift({name: 'None', value: null}, new inquirer.Separator());
  
  //prompt for rest of data
  employeeData = await inquirer.prompt([
    {
      type: 'list',
      name: 'role_id',
      message: `What is the employee's role?`,
      choices: roleChoices
    },
    {
      type: 'list',
      name: 'manager_id',
      message: `Who is the employee's manager?`,
      choices: managerChoices
    }
  ], employeeData);

  try {
    const employeeId = employeeDb.addEmployee(employeeData);
    if (employeeId) {
      console.log(`${employeeData.first_name} ${employeeData.last_name} registered.`);
    }
  } catch (err) {
    console.log('An error occurred when adding the employee.');
    console.error(err);
  }
}

/**
 * Prompts to update the role of an employee
 */
async function updateEmployeeRole() {
  
  // get the employee name and department to reassign them to
  const employees = await employeeDb.getEmployees();
  const employeeChoices = employees.map(emp => {return {name: emp.first_name + ' ' + emp.last_name, value: emp.id};});

  const departments = await employeeDb.getDepartments();
  const departmentChoices = departments.map(dept => {return {name: dept.name, value: dept.id};});
  
  const {id, department_id} = await inquirer.prompt([
    {
      type: 'list',
      name: 'id',
      message: 'Whose role would you like to update?',
      choices: employeeChoices
    },
    {
      type: 'list',
      name: 'department_id',
      message: "What department will they have a role in?",
      choices: departmentChoices
    }
  ]);

  // get the role to update the employee to
  const roles = await employeeDb.getRolesByDepartmentId(department_id);
  const roleChoices = roles.map(role => {return {name: role.title, value: role.id}});
  const {role_id} = await inquirer.prompt([
    {
      type: 'list',
      name: 'role_id',
      message: "What role do you want to assign to the selected employee?",
      choices: roleChoices
    }
  ]);

  try {
    const rowsAffected = await employeeDb.updateEmployeeRole(id, role_id);
    if (rowsAffected) {
      console.log('Successfully updated employee role.');
    }
  } catch (err) {
    console.log('An error occurred while trying to update the employee role in the database.');
    console.error(err);
  }
}

/**
 * Ends the program and closes the database connection
 */
async function endProgram() {
  console.log('Exiting program. Goodbye!');
  await employeeDb.closeConnection();
  process.exit();
}

async function init() {
  console.log(
`─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
─██████████████─██████──────────██████─██████████████─██████─────────██████████████─████████──████████─██████████████─██████████████─
─██░░░░░░░░░░██─██░░██████████████░░██─██░░░░░░░░░░██─██░░██─────────██░░░░░░░░░░██─██░░░░██──██░░░░██─██░░░░░░░░░░██─██░░░░░░░░░░██─
─██░░██████████─██░░░░░░░░░░░░░░░░░░██─██░░██████░░██─██░░██─────────██░░██████░░██─████░░██──██░░████─██░░██████████─██░░██████████─
─██░░██─────────██░░██████░░██████░░██─██░░██──██░░██─██░░██─────────██░░██──██░░██───██░░░░██░░░░██───██░░██─────────██░░██─────────
─██░░██████████─██░░██──██░░██──██░░██─██░░██████░░██─██░░██─────────██░░██──██░░██───████░░░░░░████───██░░██████████─██░░██████████─
─██░░░░░░░░░░██─██░░██──██░░██──██░░██─██░░░░░░░░░░██─██░░██─────────██░░██──██░░██─────████░░████─────██░░░░░░░░░░██─██░░░░░░░░░░██─
─██░░██████████─██░░██──██████──██░░██─██░░██████████─██░░██─────────██░░██──██░░██───────██░░██───────██░░██████████─██░░██████████─
─██░░██─────────██░░██──────────██░░██─██░░██─────────██░░██─────────██░░██──██░░██───────██░░██───────██░░██─────────██░░██─────────
─██░░██████████─██░░██──────────██░░██─██░░██─────────██░░██████████─██░░██████░░██───────██░░██───────██░░██████████─██░░██████████─
─██░░░░░░░░░░██─██░░██──────────██░░██─██░░██─────────██░░░░░░░░░░██─██░░░░░░░░░░██───────██░░██───────██░░░░░░░░░░██─██░░░░░░░░░░██─
─██████████████─██████──────────██████─██████─────────██████████████─██████████████───────██████───────██████████████─██████████████─
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
─██████████████─████████████████───██████████████─██████████████─██████──████████─██████████████─████████████████───
─██░░░░░░░░░░██─██░░░░░░░░░░░░██───██░░░░░░░░░░██─██░░░░░░░░░░██─██░░██──██░░░░██─██░░░░░░░░░░██─██░░░░░░░░░░░░██───
─██████░░██████─██░░████████░░██───██░░██████░░██─██░░██████████─██░░██──██░░████─██░░██████████─██░░████████░░██───
─────██░░██─────██░░██────██░░██───██░░██──██░░██─██░░██─────────██░░██──██░░██───██░░██─────────██░░██────██░░██───
─────██░░██─────██░░████████░░██───██░░██████░░██─██░░██─────────██░░██████░░██───██░░██████████─██░░████████░░██───
─────██░░██─────██░░░░░░░░░░░░██───██░░░░░░░░░░██─██░░██─────────██░░░░░░░░░░██───██░░░░░░░░░░██─██░░░░░░░░░░░░██───
─────██░░██─────██░░██████░░████───██░░██████░░██─██░░██─────────██░░██████░░██───██░░██████████─██░░██████░░████───
─────██░░██─────██░░██──██░░██─────██░░██──██░░██─██░░██─────────██░░██──██░░██───██░░██─────────██░░██──██░░██─────
─────██░░██─────██░░██──██░░██████─██░░██──██░░██─██░░██████████─██░░██──██░░████─██░░██████████─██░░██──██░░██████─
─────██░░██─────██░░██──██░░░░░░██─██░░██──██░░██─██░░░░░░░░░░██─██░░██──██░░░░██─██░░░░░░░░░░██─██░░██──██░░░░░░██─
─────██████─────██████──██████████─██████──██████─██████████████─██████──████████─██████████████─██████──██████████─
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────\n`);

  try {
    await employeeDb.initializeConnection();
  } catch (err) {
    console.error(`An error occurred trying to connect to MySQL.`,
    `Make sure you have MySQL server installed and running`);
    process.exit(1);
  }
  displayMainPrompt();
}

init();