const Joi = require('joi');
const DataAccess = require('./data_access');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
var cors = require('cors')

const data_access = new DataAccess('localhost', 'neu_fair_system', 'root', 'neufairadmin18');

var app = express()

app.use(cors({
    origin: 'http://192.168.43.232:8081',
    credentials: true
}));

app.use(express.json());

app.use(cookieParser());
var MemoryStore = session.MemoryStore;
app.use(session({
    name: 'app.sid',
    secret: "1234567890QWERTY",
    resave: true,
    saveUninitialized: true
}));

//returns the list of teams with their team_name, college and the url of the college logo
app.get('/api/teams', (req, res) => {
    data_access.query('select team_name, college, logo from teams', [], (result) => {
        res.send(result);
    })
});

//returns a specific team
app.get('/api/teams/:team_name', (req, res) => {
    data_access.query('select * from teams where team_name = ?', [req.params.team_name],
        (result) => {
            res.send(result[0]);
        })
});

//returns the scores given by judge to a team per criteria
app.get('/api/scores/:team_name/:judge_num', (req, res) => {
    const {
        team_name,
        judge_num
    } = req.params;
    data_access.query(`select teams.team_name, 
    judges.judge_num, criterias.criteria, criterias.percentage, scores.score
    from teams join judges join criterias 
    left join scores on scores.team_name = teams.team_name 
    and scores.judge_num = judges.judge_num 
    and scores.criteria = criterias.criteria 
    where teams.team_name = ? and judges.judge_num = ?`, [team_name, judge_num],
        (result) => {
            res.send(result);
        })
});

//returns all the scores given to a team by all judges
app.get('/api/scores/:team_name', (req, res) => {
    const {
        team_name
    } = req.params;
    data_access.query(`select scores.criteria, scores.judge_num, score, timestamp, percentage from scores 
    left join criterias on scores.criteria = criterias.criteria 
    where team_name = ? order by criteria`, [team_name],
        (result) => {
            res.send(result);
        })
});


//returns all the scores from all teams
app.get('/api/scores', (req, res) => {
    data_access.query(`select team_name, scores.criteria, scores.judge_num, score, timestamp, percentage from scores 
    left join criterias on scores.criteria = criterias.criteria 
    order by criteria`, [],
        (result) => {
            res.send(result);
        });
});

//returns total score of a team given by a specific judge
app.get('/api/score/:team_name/:judge_num', (req, res) => {
    let {
        team_name,
        judge_num
    } = req.params
    data_access.query('select sum(score) as score from scores where team_name = ? and judge_num = ?',
        [team_name, judge_num],
        (result) => {
            res.send(result[0])
        })
});


//returns the total score per team given by a specific judge.
app.get('/api/judges/scores/:judge_num', (req, res) => {
    data_access.query(`
    select team_name, college, logo, judge_num, score from 
    (select team_name, college, logo, judge_num, sum(score) as score from 
    (select teams.team_name, teams.college, teams.logo, scores.judge_num, scores.score 
    from teams left outer join scores on scores.team_name = teams.team_name ) as e 
    group by team_name, judge_num) as f where judge_num = ? or judge_num is null order by team_name`, [req.params.judge_num], (result) => {
        res.send(result);
    });
})

//returns current rankings based on score, no tie breaker yet
app.get('/api/rankings', (req, res) => {
    data_access.query(`select team_name, (sum(score) / (select count(judge_num) from judges)) as average_score, (rank() over (order by sum(score) desc)) as ranking from scores group by team_name`, [],
        (result) => {
            res.send(result);
        });
});

app.put('/api/scores', (req, res) => {
    //validate if the structure of the posted json matches the database
    let schema = {
        team_name: Joi.string().min(3).required(),
        criteria: Joi.string().min(3).required(),
        judge_num: Joi.number().min(0).required(),
        score: Joi.number().min(0).max(100).required(),
        percentage: Joi.number()
    };

    delete req.body.percentage;

    let timestamp = new Date().getTime()

    let validaton_result = Joi.validate(req.body, schema);

    if (!validaton_result.error) {
        req.body.timestamp = timestamp;

        data_access.query('insert into scores set ?', req.body, (result, error) => {
            if (error) {
                //if there is duplicate, just update the existing
                if (error.code == 'ER_DUP_ENTRY') {
                    let {
                        team_name,
                        criteria,
                        judge_num,
                        score,
                    } = req.body;
                    data_access.query(`update scores set score = ?, timestamp = ? 
                    where team_name = ? AND criteria = ? AND judge_num = ?`,
                        [score, timestamp, team_name, criteria, judge_num], (r, e) => {
                            if (e) return res.send(e.code);
                            else {
                                return res.send(r);
                            }
                        });
                } else {
                    return res.send(error)
                }
            } else {
                return res.send(result)
            }
        })
    } else {
        res.send(validaton_result.error.message);
    }
});

app.get('/login/:first_name/:last_name', (req, res) => {
    req.session.first_name = req.params.first_name;
    req.session.last_name = req.params.last_name;

    res.send('session writtn')
})

app.post('/login', (req, res) => {

    let schema = {
        first_name: Joi.string().min(2).required(),
        last_name: Joi.string().min(2).required()
    }

    let validation_result = Joi.validate(req.body, schema);

    if (validation_result.error) {
        return res.send(validation_result.error.message)
    }

    let {
        first_name,
        last_name
    } = req.body;
    req.session.first_name = first_name;
    req.session.last_name = last_name;

    data_access.query('select * from judges where first_name = ? and last_name = ?',
        [first_name, last_name], (result, error) => {
            if (error) {
                return res.send(error.message)
            }

            if (result.length > 0) {
                req.session.first_name = first_name;
                req.session.last_name = last_name;
                req.session.judge_num = result[0].judge_num;
                req.session.save()
                req.session.cookie.maxAge = 30 * 60 * 1000; // 5 minutes

                return res.send(result[0]);
            } else {
                return res.send('User not found');
            }
        })
});


app.get('/', (req, res) => {
    res.send(req.session)
})

const port = process.env.port || 8888;
app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});