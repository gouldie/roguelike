import React from 'react'
import ReactDOM from 'react-dom'

class App extends React.Component {
  render() {
    return (
      <Grid />
      
    );
  }
}

class Grid extends React.Component {
  constructor(props) {
    super(props);

    // name: level
    let enemies = {
      bat: 2,
      boss: 6
    }

    this.state = {
      grid: [],
      rooms: [],
      rows: 50,
      cols: 50,
      rooms: [],
      player: {},
      health: 100,
      damage: 5,
      weapon: "None",
      enemies: enemies,
      curEnemies: [],
      level: 1,
      exp: 0,
      alert: "Arrow buttons/WASD to move. Good luck!",
      alertClasses: "alert alert-info"
    }

    this.createGrid = this.createGrid.bind(this);
  }

  componentDidMount() {
    this.createGrid();
    
    document.addEventListener('keydown', () => {
      if (this.state.health > 0) {
        this.playerMove(event);
      }
    })
    
    // $(document).keydown((event) => {
    //   if (this.state.health > 0) {
    //     this.playerMove(event);
    //   }
    // })
  }

  createGrid() {
    let totalCells = this.state.cols * this.state.rows;
    let grid = [];
    let openCells = 0;
    let endResult = {};

    // Create initial grid
    for (let x = 0; x < this.state.rows; x++) {
      grid[x] = [];
      for (let y = 0; y < this.state.cols; y++) {
        grid[x][y] = "closed";
      }
    }

    // Create rooms
    while (openCells < totalCells / 4) {
      var result = this.suggestRoom(grid);
      if (result) {
        grid = result.result;
        openCells += result.changes;
      }
    }

    // Create corridors
    let newGrid = this.createCorridors(grid);

    // Set player spawn
    let player = {};
    player.x = this.state.rooms[0].roomCenterX;
    player.y = this.state.rooms[0].roomCenterY;
    newGrid[player.x][player.y] = "player";

    // Spawn health and damage boosts
    endResult = this.placeRandomly(newGrid, this.state.curEnemies, "health", 3);
    endResult = this.placeRandomly(endResult.newGrid, endResult.newCurEnemies, "damage", 5);
    
    // Spawn enemies
    endResult = this.placeRandomly(endResult.newGrid, endResult.newCurEnemies, "bat", 10);
    
    // Spawn boss
    endResult = this.placeRandomly(endResult.newGrid, endResult.newCurEnemies, "boss", 1);

    this.setState({
      curEnemies: endResult.newCurEnemies,
      grid: endResult.newGrid,
      player: player
    });
  }

  suggestRoom(curGrid) {
    let roomCols, roomRows, topLeftX, topLeftY, roomCenterX, roomCenterY,
      newGrid = curGrid.map(function(arr) {
        return arr.slice();
      });
    let getRandomArbitrary = function(min, max) {
      return Math.floor(Math.random() * (max - min) + min);
    }

    roomCols = getRandomArbitrary(3, this.state.cols / 6);
    roomRows = getRandomArbitrary(3, this.state.rows / 6);

    topLeftX = getRandomArbitrary(1, this.state.cols - roomCols - 1);
    topLeftY = getRandomArbitrary(1, this.state.rows - roomRows - 1);

    roomCenterX = Math.floor(roomCols / 2 + topLeftX);
    roomCenterY = Math.floor(roomRows / 2 + topLeftY);

    for (var x = topLeftX; x < topLeftX + roomCols; x++) {
      for (var y = topLeftY; y < topLeftY + roomRows; y++) {
        if (curGrid[x][y] == "open") {
          return false;
        } else {
          newGrid[x][y] = "open";
        }
      }
    }

    let newRooms = this.state.rooms.push({
      topLeftX: topLeftX,
      topLeftY: topLeftY,
      roomCenterX: roomCenterX,
      roomCenterY: roomCenterY,
      roomCols: roomCols,
      roomRows: roomRows
    });
    this.setState({
      rooms: newRooms
    });

    return {
      result: newGrid,
      changes: roomCols * roomRows
    }
  }

  createCorridors(curGrid) {
    let rooms = this.state.rooms,
      newGrid = curGrid.map(function(arr) {
        return arr.slice();
      });

    for (var i = 0; i < rooms.length - 1; i++) {
      let first = {};
      first.roomCenterX = rooms[i].roomCenterX;
      first.roomCenterY = rooms[i].roomCenterY;

      let last = {};
      last.roomCenterX = rooms[i + 1].roomCenterX;
      last.roomCenterY = rooms[i + 1].roomCenterY;

      let lowestX = first.roomCenterX < last.roomCenterX ? first : last,
        highestX = first.roomCenterX > last.roomCenterX ? first : last,
        lowestY = first.roomCenterY < last.roomCenterY ? first : last,
        highestY = first.roomCenterY > last.roomCenterY ? first : last;

      for (var x = lowestX.roomCenterX; x <= highestX.roomCenterX; x++) {
        newGrid[x][lowestX.roomCenterY] = "open";
      }

      if (lowestX == lowestY) {
        for (var y = lowestY.roomCenterY; y <= highestY.roomCenterY; y++) {
          newGrid[highestY.roomCenterX][y] = "open";
        }
      } else {
        for (var y = lowestY.roomCenterY; y <= highestY.roomCenterY; y++) {
          newGrid[lowestY.roomCenterX][y] = "open";
        }
      }
    }

    return newGrid;
  }

  playerMove(event) {
    if (this.state.health <= 0) return
    let newGrid = [];
    let currentPos = this.state.player;
    let targetPos = {};
    let newPlayerPos = {};
    let newHealth = this.state.health;
    let newDamage = this.state.damage;
    let newExp = this.state.exp;
    let newWeapon = this.state.weapon;
    let slain;
    let newAlertText;
    let newAlertClasses;
    let healthLost;
    
    if (this.state.health <= 0) { return; }
    
    newGrid = this.state.grid.map(function(arr) {
      return arr.slice();
    });
    targetPos.x = currentPos.x;
    targetPos.y = currentPos.y;

    switch (event.keyCode) {
      case 87:
      case 38:
        targetPos.x = targetPos.x - 1;
        break;
      case 65:
      case 37:
        targetPos.y = targetPos.y - 1;
        break;
      case 68:
      case 39:
        targetPos.y = targetPos.y + 1;
        break;
      case 83:
      case 40:
        targetPos.x = targetPos.x + 1;
        break;
      default:
        return;
    }

    let targetContains = this.state.grid[targetPos.x][targetPos.y];

    switch (targetContains) {
      case "open":
        newGrid[targetPos.x][targetPos.y] = "player";
        newGrid[currentPos.x][currentPos.y] = "open";
        newPlayerPos.x = targetPos.x;
        newPlayerPos.y = targetPos.y;
        newAlertText = this.state.alert;
        newAlertClasses = this.state.alertClasses;
        break;
      case "health":
        newGrid[targetPos.x][targetPos.y] = "player";
        newGrid[currentPos.x][currentPos.y] = "open";
        newPlayerPos.x = targetPos.x;
        newPlayerPos.y = targetPos.y;
        newHealth += 20;
        newAlertText = "Picked up a health potion! Gained 20 health.";
        newAlertClasses = "alert alert-success";
        break;
      case "damage":
        newGrid[targetPos.x][targetPos.y] = "player";
        newGrid[currentPos.x][currentPos.y] = "open";
        newPlayerPos.x = targetPos.x;
        newPlayerPos.y = targetPos.y;
        newDamage += 3;
        newAlertText = "You find a mysterious elixir, granting you strength. Gained 3 damage.";
        newAlertClasses = "alert alert-success";
        break;
      case "bat":
        slain = this.combat("bat", targetPos.x, targetPos.y);
        newHealth = slain.newHealth;
        if (slain.result) {
          newGrid[targetPos.x][targetPos.y] = "player";
          newGrid[currentPos.x][currentPos.y] = "open";
          newPlayerPos.x = targetPos.x;
          newPlayerPos.y = targetPos.y;
          newExp += 20;
          this.calcLevel(newExp);
          
          // 50% chance to drop weapon
          if (this.state.weapon == "None") {
            let rand = Math.floor(Math.random() * 2);
            if (rand) {
              newWeapon = "Scimitar";
              newDamage += 2;
              
            }
          }
          
          // Success alert
          if (this.state.weapon != newWeapon) {
            newAlertText = "Bat defeated! Found a Scimitar (+2 Damage Bonus).";
          } else {
            newAlertText = "Bat defeated! Gained exp.";
          }
          newAlertClasses = "alert alert-success";
          
        } else {
          newGrid[targetPos.x][targetPos.y] = "bat";
          newGrid[currentPos.x][currentPos.y] = "player";
          newPlayerPos.x = this.state.player.x;
          newPlayerPos.y = this.state.player.y;
          healthLost = this.state.health - newHealth;
          newAlertText = "Ouch. Took " + healthLost + " damage from the Bat.";
          newAlertClasses = "alert alert-danger";
        }
        break;
        case "boss":
          slain = this.combat("boss", targetPos.x, targetPos.y);

          if (slain) {
            newHealth = slain.newHealth;
            if (slain.result) {
              newGrid[targetPos.x][targetPos.y] = "player";
              newGrid[currentPos.x][currentPos.y] = "open";
              newPlayerPos.x = targetPos.x;
              newPlayerPos.y = targetPos.y;
              newExp += 100;
              this.calcLevel(newExp);
              newAlertText = "You defeated the Boss and completed the game!";
              newAlertClasses = "alert alert-success";
            } else {
              newGrid[targetPos.x][targetPos.y] = "boss";
              newGrid[currentPos.x][currentPos.y] = "player";
              newPlayerPos.x = this.state.player.x;
              newPlayerPos.y = this.state.player.y;
              healthLost = this.state.health - newHealth;
              newAlertText = "OOF! Boss pummels you for " + healthLost + " damage.";
              newAlertClasses = "alert alert-danger";
            }
          } else {
            newHealth = 0
            newAlertText = "You die. :(";
            newAlertClasses = "alert alert-danger";
          }

          break;
      default:
        return;
    }

    this.setState({
      alert: newAlertText,
      alertClasses: newAlertClasses,
      weapon: newWeapon,
      exp: newExp,
      grid: newGrid,
      player: newPlayerPos,
      health: newHealth,
      damage: newDamage
    });
  }

  combat(enemy, enemyX, enemyY) {
    if (!this.state.enemies.hasOwnProperty(enemy)) {
      return;
    }

    let playerDamageRange = (Math.floor(Math.random() * 5)) - 2;
    let enemyDamageRange = (Math.floor(Math.random() * 5)) - 2;
    let enemyDamage = (this.state.enemies[enemy] * 3) + enemyDamageRange;
    let curHealth = 0;
    curHealth = this.state.health;
    let newHealth = 0;
    let playerDamage = (this.state.damage + (this.state.level * 2)) + playerDamageRange;
    let curEnemies = [];
    let slain = {};
    curEnemies = this.state.curEnemies.map(function(arr) {
      return arr;
    });

    // Enemy attack
    newHealth = curHealth - enemyDamage;
    slain.newHealth = newHealth;

    if (newHealth <= 0) { 
      this.state.health = 0;
      return; 
    }
    
    // Player attack
    for (let i = 0; i < curEnemies.length; i++) {
      if (curEnemies[i].x == enemyX && curEnemies[i].y == enemyY) {
        let newEnemyHealth = curEnemies[i].health - playerDamage;
        if (newEnemyHealth <= 0) {
          curEnemies.splice(i, 1);
          slain.result = true;
        } else {
          curEnemies[i].health = newEnemyHealth;
        }
        break;
      }
    }

    //this.setState({ health: 76, grid: newGrid, curEnemies: curEnemies });
    return slain;
  }
  
  calcLevel(exp) {
    let newLevel = 0;
    newLevel = Math.ceil((exp+1)/50);
    
    this.setState({ level: newLevel });
  }

  placeRandomly(grid, curEnemies, thing, quantity) {
    let placed = 0;
    let newGrid = [];
    let newCurEnemies = [];
    let getRandomArbitrary = function(min, max) {
      return Math.floor(Math.random() * (max - min) + min);
    };
    
    newGrid = grid.map(function(arr) {
      return arr.slice();
    });

    newCurEnemies = curEnemies.map(function(arr) {
      return arr;
    });

    while (placed < quantity) {
      var randX = getRandomArbitrary(1, this.state.cols - 1);
      var randY = getRandomArbitrary(1, this.state.rows - 1);
      if (newGrid[randX][randY] == "open") {
        newGrid[randX][randY] = thing;
        placed++;
        if (this.state.enemies.hasOwnProperty(thing)) {
          newCurEnemies.push({
            x: randX,
            y: randY,
            health: this.state.enemies[thing] * 8
          });
        }
      }
    }

    // this.setState({
    //   curEnemies: newCurEnemies
    // });
    let result = {};
    result.newGrid = newGrid;
    result.newCurEnemies = newCurEnemies;
    return result;
  }

  renderGrid() {
    if (this.state.grid.length == 0) {
      return;
    }
    let grid = this.state.grid;
    let colArr = [];
    let gridArr = [];

    for (var x = 0; x < this.state.rows; x++) {
      for (var y = 0; y < this.state.cols; y++) {
        let contains = grid[x][y];
        let xDiff = Math.abs(x - this.state.player.x);
        let yDiff = Math.abs(y - this.state.player.y);
        let xShroud = (xDiff > 5);
        let yShroud = (yDiff > 5);
        let shroud = (xShroud || yShroud);
        colArr.push((<Cell contains={contains} shroud={shroud}/>));
      }
      gridArr.push((<tr>{colArr}</tr>));
      colArr = [];
    }
    return gridArr;
  }

  render() {
    return (
      <div>
        <h2>Roguelike Dungeon Crawler</h2>
        <h6>Coded by <a href="https://www.linkedin.com/in/matthew-gould">Matthew Gould</a>.</h6>
        <div className={this.state.alertClasses} >
          {this.state.alert}
        </div>
        <div className="info col-xs-3">
            <p>Health: {this.state.health}</p>
            <p>Damage: {this.state.damage}</p>
            <p id="max-width">Weapon: {this.state.weapon}</p>
            <p>Level: {this.state.level}</p>
            <p>Exp: {this.state.exp}</p>
          <hr/>
            <div className="icon-container flex">
              <div className="icon player"></div>
              <div>Player</div>
            </div>
            <div className="icon-container flex">
              <div className="icon health"></div>
              <div>Health</div>
            </div>
            <div className="icon-container flex">
              <div className="icon damage"></div>
              <div>Damage</div>
            </div>
            <div className="icon-container flex">
              <div className="icon enemy"></div>
              <div>Enemy</div>
            </div>
            <div className="icon-container flex">
              <div className="icon boss"></div>
              <div>Boss</div>
            </div>
          
        </div>
          <table className="col-xs-9">
            <tbody>
              {this.renderGrid()}
            </tbody>
          </table>
        </div>
    )
  }
}

class Cell extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      contains: this.props.contains,
      health: null,
      shroud: true
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      contains: nextProps.contains,
      shroud: nextProps.shroud
    });
  }

  render() {
    let className = this.state.contains + " " + this.props.shroud;
    return (
      <td className={className}></td>
    )
  }
}

ReactDOM.render(<App />, document.querySelector(".container"));