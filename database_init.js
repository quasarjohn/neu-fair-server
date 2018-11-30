/** 
 * This script is run only once when initializing the database for the first time.
*/
var mysql = require('mysql');
var write_test_data = true;

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "neufairadmin18",
  database: 'neu_fair_system',
  multipleStatements: true
});

const CREATE_JUDGES_QUERY = `create table judges (
  judge_num int not null primary key, 
  first_name varchar(255) not null,
  last_name varchar(255) not null
  )`;

const CREATE_CRITERIAS_QUERY = `create table criterias (
  criteria varchar(255) not null primary key, 
  percentage float not null)`;

const CREATE_TEAMS_QUERY = `create table teams (
  team_name varchar(255) not null primary key, 
  college varchar(255) not null, 
  logo varchar(255))`;

const CREATE_MEMBERS_QUERY = `create table members (
  team_name varchar(255) not null, 
  first_name varchar(255) not null, 
  last_name varchar(255) not null, 
  foreign key(team_name) references teams(team_name))`;

const CREATE_SCORES_QUERY = `create table scores (
  team_name varchar(255) not null, 
  criteria varchar(255) not null, 
  judge_num int not null,
  score int not null, 
  timestamp long not null,
  primary key(team_name, criteria, judge_num), 
  foreign key(team_name) references teams(team_name), 
  foreign key(criteria) references criterias(criteria), 
  foreign key(judge_num) references judges(judge_num)
  )`;

const JUDGES =
  `(0, "judge0", "password"), 
  (1, "judge1", "password"), 
  (2, "judge2", "password"), 
  (3, "judge3", "password")`;

const CRITERIAS = `
  ("Audience impact", 10), 
  ("Talent", 10), 
  ("Sex appeal", 80)
`

const TEAMS = `
  ("Team Duncan", "Computer Studies", "ccs.jpg"), 
  ("Team Berwolves", "Engineering", "eng.jpg"), 
  ("Team Othy Bradley", "Accountancy", "acc.png"), 
  ("team0", "CCS", "wow.png"), 
  ("team1", "CCT", "galing.png")
`

const SCORES = `
  ("team0", "Audience impact", 0, 8, ${new Date().getTime()}),
  ("team0", "Audience impact", 1, 9, ${new Date().getTime()}), 
  ("team0", "Audience impact", 2, 7, ${new Date().getTime()}), 
  ("team0", "Audience impact", 3, 6, ${new Date().getTime()}), 
  ("team0", "Talent", 0, 8, ${new Date().getTime()}), 
  ("team0", "Talent", 1, 6, ${new Date().getTime()}), 
  ("team0", "Talent", 2, 7, ${new Date().getTime()}), 
  ("team0", "Talent", 3, 5, ${new Date().getTime()}), 
  ("team0", "Sex appeal", 0, 60, ${new Date().getTime()}), 
  ("team0", "Sex appeal", 1, 70, ${new Date().getTime()}), 
  ("team0", "Sex appeal", 2, 80, ${new Date().getTime()}), 
  ("team0", "Sex appeal", 3, 90, ${new Date().getTime()}),


  ("team1", "Audience impact", 0, 8, ${new Date().getTime()}),
  ("team1", "Audience impact", 1, 7, ${new Date().getTime()}), 
  ("team1", "Audience impact", 2, 5, ${new Date().getTime()}), 
  ("team1", "Audience impact", 3, 9, ${new Date().getTime()}), 
  ("team1", "Talent", 0, 6, ${new Date().getTime()}), 
  ("team1", "Talent", 1, 5, ${new Date().getTime()}), 
  ("team1", "Talent", 2, 4, ${new Date().getTime()}), 
  ("team1", "Talent", 3, 8, ${new Date().getTime()}), 
  ("team1", "Sex appeal", 0, 70, ${new Date().getTime()}), 
  ("team1", "Sex appeal", 1, 80, ${new Date().getTime()}), 
  ("team1", "Sex appeal", 2, 90, ${new Date().getTime()}), 
  ("team1", "Sex appeal", 3, 93, ${new Date().getTime()}), 

  ("Team Duncan", "Audience impact", 0, 8, ${new Date().getTime()}),
  ("Team Duncan", "Audience impact", 1, 7, ${new Date().getTime()}), 
  ("Team Duncan", "Audience impact", 2, 5, ${new Date().getTime()}), 
  ("Team Duncan", "Audience impact", 3, 9, ${new Date().getTime()}),
  ("Team Duncan", "Talent", 0, 6, ${new Date().getTime()}), 
  ("Team Duncan", "Talent", 1, 5, ${new Date().getTime()}), 
  ("Team Duncan", "Talent", 2, 4, ${new Date().getTime()}), 
  ("Team Duncan", "Talent", 3, 8, ${new Date().getTime()}), 
  ("Team Duncan", "Sex appeal", 0, 70, ${new Date().getTime()}), 
  ("Team Duncan", "Sex appeal", 1, 80, ${new Date().getTime()}), 
  ("Team Duncan", "Sex appeal", 2, 90, ${new Date().getTime()}), 
  ("Team Duncan", "Sex appeal", 3, 93, ${new Date().getTime()})
`

con.connect(function (err) {
  if(err) console.log(err.message)
  console.log("Connected!");

  con.query(`${CREATE_JUDGES_QUERY}; ${CREATE_CRITERIAS_QUERY}; 
  ${CREATE_TEAMS_QUERY}; ${CREATE_MEMBERS_QUERY}; ${CREATE_SCORES_QUERY}`,
    (err, result) => {
      if (err) console.log(err.message);
      console.log("Database created");
    });

  if (write_test_data) {
    con.query(`
    insert into judges values ${JUDGES}; 
    insert into criterias values ${CRITERIAS}; 
    insert into teams values ${TEAMS}; 
    insert into scores values ${SCORES}; 
    `,
      (err, result) => {
        if (err) console.log(err.message);
        console.log("Data inserted")
      })
  }
  con.end(() => {
    console.log("Operation completed")
  })
});


