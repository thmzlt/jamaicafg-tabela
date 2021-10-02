import type { NextPage } from "next"
import { useState, useEffect } from "react";
import initSql from "sql.js";
import * as icons from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const Home: NextPage = () => {
  const [_error, setError] = useState<any>();
  const [execResults, setExecResults] = useState<any>({"columns": [], "values": []});

  useEffect(() => {
    const config = {locateFile: (file: String) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.1/${file}`}

    const sqlPromise = initSql(config)
    const dbBlobPromise = fetch("/db.sqlite3").then(data => data.arrayBuffer())

    Promise.all([sqlPromise, dbBlobPromise]).then(([sql, buffer]) => {
      const db = new sql.Database(new Uint8Array(buffer));

      const [table] = db.exec(`
        SELECT 
          players.name as name,
          count(caps.name) as caps,
          sum(rounds.points) as points,
          sum(caps.goals) as goals_scored,
          round(sum(rounds.points) / cast(count(caps.name) as real) / 3 * 100, 1) as efficiency,
          sum(rounds.goals_scored) as team_goals_scored,
          sum(rounds.goals_allowed) as team_goals_allowed,
          sum(rounds.goals_scored) - sum(rounds.goals_allowed) as diff,
          round(sum(rounds.goals_scored) / cast(count(caps.name) as real), 1) as average_scored,
          round(sum(rounds.goals_allowed) / cast(count(caps.name) as real), 1) as average_allowed
        FROM
          players, caps, rounds
        WHERE
          players.name = caps.name AND 
          caps.round = rounds.round AND
          caps.captain = rounds.captain
        GROUP BY
          players.name
        ORDER BY
          points DESC, diff DESC, team_goals_scored DESC, goals_scored DESC, name ASC
      `)
      setExecResults(table)
      setError(null)
    });
  }, []);

  if (execResults == null) {
    return <p>loading...</p>
  }

  const entries = []

  for (let i = 0; i < execResults.values.length; i++) {
    const record = execResults.values[i]
    const id = record[0] as string;
    console.log(record)

    entries.push(
      <li key={record}>
        <div className="top">
          <span className="ranking">{i+1}</span>
          <span className="name">{id}</span>
          <div className="points">{record[2]}
            <span className="tag">pt</span>
          </div>
        </div>
        <div className="stats">
          <div className="">
            <FontAwesomeIcon icon={icons.faTshirt}></FontAwesomeIcon>
            {record[1].toFixed(0)} 
          </div>
          <div className="">
            <FontAwesomeIcon icon={icons.faBalanceScaleRight}></FontAwesomeIcon>
            {(record[7] < 0 ? "" : "+") + record[7].toFixed(0)}
          </div>
          <div className="">
            <FontAwesomeIcon icon={icons.faFutbol}></FontAwesomeIcon>
            {record[3].toFixed(0)}
          </div>
          <div className="">
            <FontAwesomeIcon icon={icons.faPlusCircle}></FontAwesomeIcon>
            {record[8].toFixed(1)}
          </div>
          <div className="">
            <FontAwesomeIcon icon={icons.faMinusCircle}></FontAwesomeIcon>
            {record[9].toFixed(1)}
          </div>
        </div>
      </li>
    )
  }

  return( 
    <div className="container">
      <div className="header">
        <img src="/escudo.jpeg"></img>
        <h1>Jamaica FG 2021</h1>
      </div>
      <div className="content">
        <ul>{entries}</ul>
      </div>
      <div className="footer">
        <div className="">
          <FontAwesomeIcon icon={icons.faTshirt}></FontAwesomeIcon> Jogos
        </div>
        <div className="">
          <FontAwesomeIcon icon={icons.faBalanceScaleRight}></FontAwesomeIcon> Saldo de gols
        </div>
        <div className="">
          <FontAwesomeIcon icon={icons.faFutbol}></FontAwesomeIcon> Gols marcados
        </div>
        <div className="">
          <FontAwesomeIcon icon={icons.faPlusCircle}></FontAwesomeIcon> Média de gols pró
        </div>
        <div className="">
          <FontAwesomeIcon icon={icons.faMinusCircle}></FontAwesomeIcon> Média de gols contra
        </div>
      </div>
    </div>
  );
}

export default Home
