/**
 * This is a script to initialize the database used in the app.
 */
const mysql = require('mysql2/promise');
const inquirer = require('inquirer');
const fs = require('fs/promises');
const { connection } = require('./employeeDb');
require('dotenv').config();

async function main() {
  // connect to database
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true,
      namedPlaceholders: true
    });
  } catch (err) {
    console.log(`An error occurred trying to connect to the database.`,
    `Make sure that the MySQL server is running on localhost and that 'DB_USER' and 'DB_PASSWORD' are defined in './.env'.`);
    process.exit(1);
  }
 
  // create database based on ./sql/schema.sql
  try {
    const schemaQuery = await fs.readFile('./sql/schema.sql', {encoding: 'utf8'});
    await connection.query(schemaQuery);
  } catch (err) {
    console.log(
      `An error occurred when creating the database.`,
      `Try using the MySQL console or workbench to run ./sql/schema.sql instead.`);
    console.error(err);
    await connection.end();
    process.exit(1);
  }
  console.log('Employee database created successfully!');
  
  // prompt to seed database 
  const {toSeedOrNotToSeed} = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'toSeedOrNotToSeed',
      message: 'Would you like to seed the database with sample data?'
    }
  ]);

  if (toSeedOrNotToSeed) {
    // seed based on ./sql/seeds.sql
    try {
      const seedQuery = await fs.readFile('./sql/seeds.sql', {encoding: 'utf8'});
      await connection.query(seedQuery);
    } catch (err) {
      console.log(
        `An error occurred when seeding the database.`,
        `Try using the MySQL console or workbench to run ./sql/seeds.sql instead.`);
      await connection.end();
      console.error(err);
      process.exit(1);
    }
    console.log(`Database seeded successfully!`);
  }
  await connection.end();
  process.exit();
}

main();