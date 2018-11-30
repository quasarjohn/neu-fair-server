const Joi = require('joi');
const DataAccess = require('./data_access');
const express = require('express');

const data_access = new DataAccess('localhost', 'neu_fair_system', 'root', 'neufairadmin18');
const app = express();
app.use(express.json());

app.get('/', (resq, res) => {
    res.send('NEU api version 1')
})

//returns the list of teams with their team_name, college and the url of the college logo
app.get('/api/teams', (req, res) => {
    data_access.query('select * from teams', (result) => {
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
    const { team_name } = req.params;
    const { judge_num } = req.params;
    data_access.query(`select scores.criteria, 
    scores.score, scores.timestamp, criterias.percentage from scores 
    left join criterias on scores.criteria = criterias.criteria 
    where team_name = ? AND judge_num = ?`, [team_name, judge_num],
        (result) => {
            res.send(result);
        })
});

//returns all the scores given to a team by all judges
app.get('/api/scores/:team_name', (req, res) => {
    const { team_name } = req.params;
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
        timestamp: Joi.number().min(new Date().getTime()).required()
    };

    let validaton_result = Joi.validate(req.body, schema);

    if (!validaton_result.error) {
        data_access.query('insert into scores set ?', req.body, (result, error) => {
            //if there is duplicate, just update the existing
            if (error) {
                if (error.code == 'ER_DUP_ENTRY') {
                    let { team_name, criteria, judge_num, score, timestamp } = req.body;
                    data_access.query(`update scores set score = ?, timestamp = ? 
                    where team_name = ? AND criteria = ? AND judge_num = ?`,
                        [score, timestamp, team_name, criteria, judge_num], (r, e) => {
                            if (e) return res.status(400).send(e.code);
                            else {
                                return res.send(r);
                            }
                        });
                } else {
                    return res.status(400).send(error.code)
                }
            } else {
                return res.send(result)
            }
        })
    } else {
        res.status(400).send(validaton_result.error.message);
    }
})

const port = process.env.port || 8888;
app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});