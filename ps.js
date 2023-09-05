/**
Solver: 
  - tackle a very small problem first!
    - 2 x 3 grid, with bent tri-omino's 
      - construct the graph  - manually!
      - solve the graph - first solver done!!!
      - print the output - printed the list of placements!
      
Taking a step back, what is the problem I am trying to solve?
 I want to design a polyomino solver which will allow me to solve the problem
 of fitting copies of a polyomino into a rectangle. The solver should work quickly
 to solve two sub-problems (a) return a result when there is a solution, and (b) 
 return the response "False!" when there is no solution. There may be optimizations
 needed to address each of these sub-problems. If anything, (b) is MORE IMPORTANT 
 than (a), and should certainly happen at a comparable pace.      
  
  
 Problem: squares can get "segmented" from the rest of the puzzle.
 Solution: 1. Keep a ref-count on the constraint.
           2. When we place a tile, track if any constraint's ref-count is maxed out.
           3. If that condition is met then skip the search and immediately un-place 
              the tile.  
              
              
 The story so far: 
   - have a naive solver which can solve the Y-pentomino 15x15 puzzle in 60 seconds
   - implemented DLX, however, for the same puzzle, we get 90 seconds.
   - DLX code appears to be correct, but maybe I'm doing something subtly wrong :)              
   - smaller puzzles (e.g. the 10x15 puzzle) are super fast with either solver.
   
 Update: 
   - I applied the optimization given in Knuth's paper where we choose the column
     with the fewest 1's each time rather than just the first column. Now the time
     went down from 90s to 3s. Compare: PolySolver takes 10s.  
         
**/



function Rectangle(x, y){ 
  this.x = x
  this.y = y
}

function Polyomino(vertices){ 
  this.vertices = vertices
  
  this.maxX = 0
  this.maxY = 0
  
  this.setMax()
}

Polyomino.prototype.setMax = function(){ 
  for(var i = 0 ; i < this.vertices.length; i++){ 
    var x = this.vertices[i][0]
    var y = this.vertices[i][1]
    
    if(x > this.maxX)
      this.maxX = x
      
    if(y > this.maxY)
      this.maxY = y  
  }
}

Polyomino.prototype.clone = function(){ 
  var r = new Polyomino([])
  for(var i = 0; i < this.vertices.length; i++){ 
    r.vertices.push([this.vertices[i][0], this.vertices[i][1]])    
  }
 
  r.setMax()
  
  return r
}

Polyomino.prototype.rotate = function(){ 
  for(var i = 0; i < this.vertices.length; i++){ 
    var x = this.vertices[i][0]
    var y = this.vertices[i][1]
    
    this.vertices[i][0] = this.maxY - y
    this.vertices[i][1] = x
  }
  
  var maxX = this.maxX
  var maxY = this.maxY
  
  this.maxX = maxY
  this.maxY = maxX
  
  return this
}

Polyomino.prototype.reflect = function(){ 
  for(var i = 0; i < this.vertices.length; i++){ 
    var x = this.vertices[i][0]
    var y = this.vertices[i][1]
    
    this.vertices[i][0] = this.maxX - x
    this.vertices[i][1] = y
  }
  
  return this
}

function Constraint(index, x, y){ 
  this.index = index
  this.x = x
  this.y = y
  this.placements = []
  this.count = 0
  this.placement = -1
}

function Placement(index){
  this.index = index 
  this.constraints = []
  this.count = 0
}

Placement.prototype.add = function(constraint){
  this.constraints.push(constraint.index)
  constraint.placements.push(this.index)
}



/**
 Suggest, when we port, to make Link, Column and Head all the same class - Link
**/

function Link(){ 
  
  this.up = null
  this.down = null
  this.right = null
  this.left = null
  this.column = null
}

function Column(constraint){ 
  this.constraint = constraint

  this.up = null
  this.down = null
  this.right = null
  this.left = null
  
  this.size = 0
}

function Head(){
  this.left = null
  this.right = null
}


function DLX(){ 
  //graph consists of a set of placements and set of constraints
  this.placements = []
  this.constraints = []
 
  this.display = []
  
  this.untiled = 0 
  this.result = ''
}

DLX.prototype.initDisplay = function(){ 
  for(var j = 0 ; j < this.grid[0].length; j++){ 
    var row = [] 
    for(var i = 0; i < this.grid.length; i++){ 
      row.push('.')
    }
    this.display.push(row)
  }
}

DLX.prototype.initialize = function(rect, poly){ 
  //create a grid (inside rectangle?) which contains all the constraints
  //& put the constraints into the constraints array
  
  this.grid = []
  
  this.constraints = []
  
  var index = 0
  for(var i = 0; i < rect.x; i++){ 
    var column = []
    for(var j = 0; j < rect.y; j++){
      var c = new Constraint(index, i, j)
      column.push(c)
      this.constraints.push(c)
      index++
    }
    this.grid.push(column)
  }
  
  this.initDisplay()
  
  //create a set of 8 Polyomino's from the initial polyomino
  var polyominos = [poly]
  
  for(var i = 0; i < 7; i++){ 
    polyominos.push(poly.clone())
  }
  
  polyominos[1].rotate()
  polyominos[2].rotate().rotate()
  polyominos[3].rotate().rotate().rotate()
  
  polyominos[4].reflect()
  polyominos[5].reflect().rotate()
  polyominos[6].reflect().rotate().rotate()
  polyominos[7].reflect().rotate().rotate().rotate()

  
  //create placements from the set of polyominos, by referencing the grid
  this.placements = []
  
  var placementIndex = 0
  
  for(var i = 0; i < rect.x; i++){ 
    for(var j = 0; j < rect.y; j++){
      for(var p = 0; p < polyominos.length; p++){ 
        if(i + polyominos[p].maxX < rect.x && j + polyominos[p].maxY < rect.y)
        { 
          var placement = new Placement(placementIndex)
          this.placements.push(placement)
          
          for(var c = 0; c < polyominos[p].vertices.length; c++){ 
            placement.add(this.grid[i + polyominos[p].vertices[c][0]][j + polyominos[p].vertices[c][1]])          
          }
         
          placementIndex++ 
        }       
      } 
    }  
  }
  
  this.untiled = this.constraints.length
  
  //now we're ready for...
  this.init()
}


DLX.prototype.init = function(){ 
  //create the matrix from the given constraints and placements
  
  var matrix = []
  for(var col = 0; col < this.constraints.length; col++){ 
    var column = []
    for(var row = 0; row < this.placements.length; row++){ 
      column.push(null)
    }
    matrix.push(column)
  }
  
  for(var p = 0; p < this.placements.length; p++){ 
    for(var c = 0; c < this.placements[p].constraints.length; c++){ 
      matrix[this.placements[p].constraints[c]][p] = new Link()
    }
  }  
  
  this.head = new Head()
  var last = this.head
  //console.log(constraints.length)
  for(var i = 0; i < this.constraints.length; i++){ 
    var col = new Column(this.constraints[i])
    col.left = last
    last.right = col
    last = col
  }
  last.right = this.head
  this.head.left = last  
  
  //create the vertical links: 
  var col = this.head

  for(var i = 0; i < matrix.length; i++){ 
    col = col.right
    
    var last = col
    
    var size = 0
    matrix[i].filter(x => x != null)
             .forEach(x => {
      last.down = x
      x.up = last
      x.column = col
      last = x   
      size++      
    })
    col.size = size
    
    last.down = col
    col.up = last
  }
  
  //create the horizontal links: 
  for(var row = 0; row < matrix[0].length; row++){ 
  
    var temp = new Link(null, null)
    var last = temp
    for(var col = 0; col < matrix.length; col++){ 
      if(matrix[col][row] != null){ 
        matrix[col][row].left = last
        last.right = matrix[col][row]
        last = last.right
      }
    }
    
    temp.right.left = last
    last.right = temp.right   
  
  }
  
  this.solution = [] 
}

DLX.prototype.printSolution = function(){ 

  var solution = []
  for(var j = 0 ; j < this.grid[0].length; j++){ 
    var row = [] 
    for(var i = 0; i < this.grid.length; i++){ 
      row.push('.')
    }
    solution.push(row)
  }
  
  for(var i = 0; i < this.solution.length; i++){ 
    var row = []
    var rowStart = this.solution[i]
    row.push(rowStart)
    var link = rowStart.right
    while(link != rowStart){ 
      row.push(link)
      link = link.right
    }
    
    var constr = row.map(x => x.column.constraint)
     
    const color = String.fromCharCode(65 + Math.floor(Math.random() * 26))  

    constr.forEach(c => {
      solution[c.y][c.x] = color
    }) 
    
  }

  this.result = solution.map(x => x.join('')).join('\n')
}

DLX.prototype.cover = function(col){ 
  col.right.left = col.left
  col.left.right = col.right

  var i = col.down
  while(i != col){ 
    var j = i.right
    while(j != i){ 
      j.down.up = j.up
      j.up.down = j.down  
      
      j.column.size--  
    
      j = j.right
    }
    i = i.down
  }   
  
}

DLX.prototype.uncover = function(col){ 
  
  var i = col.up
  while(i != col){ 
    var j = i.left
    while(j != i){ 
      j.down.up = j
      j.up.down = j    

      j.column.size++  
    
      j = j.left
    }
    i = i.up
  }   

  col.right.left = col
  col.left.right = col
  
}

DLX.prototype.chooseColumn = function(){ 
  var c = this.head.right
  var size = c.size
  var chosen = c
  
  while(c != this.head){ 
    if(c.size < size){ 
      chosen = c
      size = c.size
    }
    c = c.right
  }
  return chosen
}


DLX.prototype.search = function(k){ 
  
  /**
  if(k > this.max_k){ 
    this.max_k = k
    console.log('k = ' + k)
  }
  **/
  
  if(this.head.right == this.head){ 
    this.printSolution()
    throw('solution found')
  }    
  else{ 
    var c = this.chooseColumn()
    
    this.cover(c)
    var r = c.down
    while(r != c){ 
      this.solution[k] = r
      var j = r.right

      while(j != r){ 
        this.cover(j.column)
        j = j.right
      }
      
      this.search(k+1)
      
      j = r.left
      while(j != r){ 
        this.uncover(j.column)
        j = j.left
      }
      r = r.down
    } 
    this.uncover(c)
  }
}

DLX.prototype.solve = function(){ 
  //solve the problem and print the solution
  
  //this.max_k = 0
  
  try{ 
    this.search(0)
  }catch(e){
    console.log(e)
  }  
}


//initialize(new Rectangle(10, 15), new Polyomino([[0, 0], [0, 1], [0, 2], [0, 3], [1, 1]]))
//initialize(new Rectangle(24, 23), new Polyomino([[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 1]])) //- 15s
//initialize(new Rectangle(5, 5), new Polyomino([[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 1]])) //- 15s

//success - 9 minutes
//initialize(new Rectangle(24, 29), new Polyomino([[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 1]])) 


/***
//aborted! ( after about an hour (or so?))
initialize(
  new Rectangle(80, 63), 

  new Polyomino([[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], 
                 [1, 0], [1, 1], [1, 2], [1, 3], [1, 4],
                                 [2, 2], [2, 3],
                                 [3, 2], [3, 3]
                
]))
***/


/**
//update: failed by not finding anything (really quickly!)
//which is correct!!! ( note that I wrote the polyomino incorrectly!)
initialize(
  new Rectangle(80, 63), 

  new Polyomino([[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], 
                 [1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5],
                                         [2, 3], [2, 4],
                                         [3, 3], [3, 4]
                
]))
**/ 


/*
//success - 14seconds
initialize(
  new Rectangle(19, 28), 

  new Polyomino([[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], 
                                 [1, 2], [1, 3]
])) 
*/

/**
//solved! - 355ms
initialize( 
  new Rectangle(9, 21), 

  new Polyomino([[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], 
                 [1, 0]
])) 
**/

/**
//ran for at least 2 hours - aborted!
//note: this is a really difficult problem! No evidence that the code is incorrect.
initialize( 
  new Rectangle(19, 21), 

  new Polyomino([[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], 
                 [1, 0], [1, 1]
]))
**/
 


//R-hexomino: 
//initialize(new Rectangle(12, 9), new Polyomino([[0, 0], [0, 1], [1, 0], [1, 1], [2, 1], [0, 2]])) 

//initialize(new Rectangle(3, 4), new Polyomino([[0, 0], [0, 1], [1, 1], [1, 2]]))

//initialize(new Rectangle(18, 10), new Polyomino([[0, 0], [0, 1], [1, 0]]))

//initialize(new Rectangle(3, 2), new Polyomino([[0, 0], [0, 1], [1, 0]]))
//initialize(new Rectangle(2, 1), new Polyomino([[0, 0]])) //- WORKS!!!
//initialize(new Rectangle(4, 2), new Polyomino([[0, 0], [0, 1], [1, 0], [1, 1] ])) 
//initialize(new Rectangle(4, 2), new Polyomino([[0, 0], [0, 1], [1, 0], [1, 1] ])) 

function solve(problem){ 

  var dlx = new DLX()
  
  const p = problem.split(',')
  
  const x = p.shift()
  const y = p.shift()
  
  const rect = new Rectangle(x, y)
  
  var poly = []
  while(p.length > 0){ 
    poly.push([p.shift()-0, p.shift()-0])
  }
  
  dlx.initialize(rect, new Polyomino(poly))
  
  //dlx.initialize(new Rectangle(5, 5), new Polyomino([[0, 0], [0, 1], [0, 2], [0, 3], [1, 1]])) //- 3s

  dlx.solve()

  return dlx.result
}

function main(){ 

  console.log('STARTING...')

  var START = new Date()

  var result = solve('15,15,0,0,0,1,0,2,0,3,1,1')
  
  console.log(result)

  var END = new Date()

  console.log('ELAPSED: ', END - START)

}

main()






