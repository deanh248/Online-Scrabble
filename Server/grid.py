#Initial logic mockup/ cna be implemented as class
#Requires testing, insert items in grid nd use read nd positions nd print
#TODO: implement wild card, optimize

#Scrabble Normal:15x15, Super:21x21
_normal = 15
_super = 21

#generate grid
grid = [[0]*_normal for i in range(_normal)]

#insert char/tile into grid
def insert(index, value):
    grid[index[0]][index[1]] = value
    last = value

#print all on grid
def printGrid():
    for i in range(len(grid)):
        print(grid[i])

#checks whether tile connects to another tile
#important boundary check(index out of bound) can be implemnted at higher level(abstraction) or here
def isValidPos(index):
    #above
    if grid[index[0]-1][index[1]] != 0:
        return True
    #below
    if grid[index[0]+1][index[1]] != 0:
        return True
    #left
    if grid[index[0]][index[1]-1] != 0:
        return True
    #right
    if grid[index[0]-1][index[1]+1] != 0:
        return True                    
    return False

def isValidWord(word):
    #use read left or read top
    #can perform concurrent read/threads as read operations r safe(NO INSERT CAN OCCUR DURING READ)
    #pass word to word list to lookup
    pass

#no tiles when grid is 0
def isEmpty(sqr):
    return sqr == 0

#read from the left
#brute force search, optimisable with append or binary search(will implement later)
def readLeft(index):
    left = index[1] - 1
    while left > -1 and grid[index[0]][left] != 0:
        left -= 1
    word = ''
    while left < _normal and grid[index[0]][left] != 0:
        word += grid[index[0]][left]
        left += 1
    return word

#read from the top#
#brute force search, optimisable with append or binary search(will implement later)
def readTop(index):
    top = index[0] - 1
    while top > -1 and grid[top][index[1]] != 0:
        top -= 1
    word = ''
    while top < _normal and grid[top][index[1]] != 0:
        word += grid[top][index[1]]
        left += 1
    return word    
    


