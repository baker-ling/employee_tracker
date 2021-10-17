USE employee_db;

INSERT INTO department (name)
VALUES ("Sales"),
       ("Human Resources"),
       ("R&D");


INSERT INTO role (title, salary, department_id)
VALUES ("Sales Manager", 100000, 1),
       ("Sales Associate", 60000, 1),
       ("HR Manager", 90000, 2),
       ("HR Associate", 55000, 2),
       ("R&D Manager", 125000, 3),
       ("Project Manager", 125000, 3),
       ("Engineer", 80000, 3),
       ("Guest Researcher", 60000, 3);

INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ("Jason", "Alexander", 1, NULL),
       ("Josh", "Brolin", 2, 1),
       ("Jerry", "Seinfeld", 2, 1),
       ("Miles", "Davis", 3, NULL),
       ("Herbert", "Hancock", 4, 4),
       ("Jules", "Verne", 5, NULL),
       ("Marie", "Curie", 6, NULL),
       ("Albert", "Einstein", 7, 6),
       ("Nicola", "Tesla", 7, 6),
       ("Richard", "Feinmann", 7, 6);