/** 
 * This script is run only once when initializing the database for the first time.
 * Initialize database for production
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

const CREATE_TIE_BREAKER_QUERY = `create table tie_breaker (
  team_name varchar(255) not null, 
  judge_num int not null, 
  vote int not null, 
  timestamp long not null,
  foreign key(team_name) references teams(team_name), 
  foreign key(judge_num) references judges(judge_num), 
  primary key(team_name, judge_num)
)
`

//TODO change this to actual judges' name
const JUDGES =
  `(0, "judge0", "password"), 
  (1, "judge1", "password")`;

//TODO change to actual criterias
const CRITERIAS = `
  ("Audience impact", 10), 
  ("Talent", 10), 
  ("Sex appeal", 80)
`
//TODO change to actual teams participating in the event
const TEAMS = `
  ("Team Duncan", "Computer Studies", "ccs.png"), 
  ("Team Berwolves", "Engineering", "ccs.png"), 
  ("Team Othy Bradley", "Accountancy", "ccs.png"), 
  ("team0", "CCS", "ccs.png"), 
  ("team1", "CCT", "ccs.png")
`

con.connect(function (err) {
  if(err) console.log(err.message)
  console.log("Connected!");

  con.query(`${CREATE_JUDGES_QUERY}; 
  ${CREATE_CRITERIAS_QUERY}; 
  ${CREATE_TEAMS_QUERY}; 
  ${CREATE_MEMBERS_QUERY}; 
  ${CREATE_SCORES_QUERY}; 
  ${CREATE_TIE_BREAKER_QUERY}`,
    (err, result) => {
      if (err) console.log(err.message);
      console.log("Database created");
    });

  if (write_test_data) {
    con.query(`
    insert into judges values ${JUDGES}; 
    insert into criterias values ${CRITERIAS}; 
    insert into teams values ${TEAMS}; 
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


