const fs = require("fs");
const glob = require("glob");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbFile = path.join(process.cwd(), "/public/db.sqlite3");

fs.unlink(dbFile, function (_err) {});

const db = new sqlite3.Database(dbFile);

db.serialize(function () {
  // Create database

  db.run(`
    CREATE TABLE caps (
      date string NOT NULL,
      round int NOT NULL,
      name string NOT NULL,
      captain string NOT NULL,
      color string NOT NULL,
      goals int NOT NULL,

      PRIMARY KEY (date, round, name, captain, color, goals)
    );
  `);

  db.run(`
      CREATE VIEW players AS SELECT DISTINCT
        name
      FROM
        caps
  `);

  db.run(`
    CREATE VIEW round_goals AS SELECT
      date,
      round,
      captain,
      color,
      sum(goals) as goals
    FROM 
      caps
    GROUP BY 
      date, round, captain;
  `);

  db.run(`
    CREATE VIEW rounds AS SELECT
      t1.date as date,
      t1.round as round,
      t1.captain as captain,
      t1.color as color,
      t1.goals as goals_scored,
      t2.goals as goals_allowed,
      (
        CASE
          WHEN t1.goals > t2.goals THEN 3
          WHEN t1.goals = t2.goals THEN 1
          WHEN t1.goals < t2.goals THEN 0
        END
      ) as points
    FROM 
      round_goals t1, round_goals t2
    WHERE
      t1.round = t2.round AND t1.captain <> t2.captain
  `);

  // Load all match records

  glob(path.join(process.cwd(), "/data/match-*.json"), function (err, files) {
    for (const file of files) {
      let match = JSON.parse(fs.readFileSync(file));

      Object.keys(match.team_1_goals).forEach((name) => {
        db.run(
          "INSERT INTO caps VALUES ($date, $round, $name, $captain, $color, $goals); SELECT name FROM caps;",
          {
            $date: match.date,
            $round: match.round,
            $name: name,
            $captain: match.team_1_captain,
            $color: match.team_1_color,
            $goals: match.team_1_goals[name],
          },
          function (err) {
            err === null || console.error(err);
          }
        );
      });

      Object.keys(match.team_2_goals).forEach((name) => {
        db.run(
          "INSERT INTO caps VALUES ($date, $round, $name, $captain, $color, $goals); SELECT name FROM caps;",
          {
            $date: match.date,
            $round: match.round,
            $name: name,
            $captain: match.team_2_captain,
            $color: match.team_2_color,
            $goals: match.team_2_goals[name],
          },
          function (err) {
            err === null || console.error(err);
          }
        );
      });
    }
  });
});
