import styles from "../styles/Home.module.css";
import type { NextPage } from "next"
import { useState, useEffect } from "react";
import initSql, { Database, QueryExecResult } from "sql.js";

const Home: NextPage = () => {
  const [error, setError] = useState<any>();
  const [execResults, setExecResults] = useState<any>({"columns": [], "values": []});

  useEffect(() => {
    const config = {locateFile: (file: String) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.1/${file}`}

    const sqlPromise = initSql(config)
    const dbBlobPromise = fetch("/db.sqlite3").then(data => data.arrayBuffer())

    Promise.all([sqlPromise, dbBlobPromise]).then(([sql, buffer]) => {
      const db = new sql.Database(new Uint8Array(buffer));
      const players = db.exec("SELECT DISTINCT name FROM caps");
      const rounds = db.exec("SELECT * FROM rounds");

      const [table] = db.exec(`
        SELECT 
          players.name,
          count(caps.name) as caps,
          sum(rounds.points) as points,
          round(sum(rounds.points) / cast(count(caps.name) as real) / 3 * 100, 1) as efficiency,
          sum(rounds.goals_scored) as team_goals_scored,
          sum(rounds.goals_allowed) as team_goals_allowed,
          sum(rounds.goals_scored) - sum(rounds.goals_allowed) as diff,
          round(sum(rounds.goals_scored) / cast(count(caps.name) as real), 1) as average_scored,
          round(sum(rounds.goals_allowed) / cast(count(caps.name) as real), 1) as average_allowed,
          sum(caps.goals) as goals_scored
        FROM
          players, caps, rounds
        WHERE
          players.name = caps.name AND 
          caps.round = rounds.round AND
          caps.captain = rounds.captain
        GROUP BY
          players.name
        ORDER BY
          points DESC, goals DESC
      `)
      setExecResults(table)
      setError(null)
    });
  }, []);

  if (execResults == null) {
    return <p>loading...</p>
  }

  console.log(execResults)

  const tableHeader = []

  for (const column of execResults.columns) {
    tableHeader.push(
      <th>{column}</th>
    )
  }

  const tableRows = []

  for (const record of execResults.values) {
    const row = []

    for (let i = 0; i < execResults.columns.length; i++) {
      row.push(
        <td>{record[i]}</td>
      )
    }
    tableRows.push(
      <tr key={record.name}>
        {row}
      </tr>
    )
  }

  return( 
    <div>
      <h1>Jamaica FG</h1>
      <table>
        <thead><tr>{tableHeader}</tr></thead>
        <tbody>{tableRows}</tbody>
      </table>
    </div>
  );
}

export default Home
