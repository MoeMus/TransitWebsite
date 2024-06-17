import mysql.connector

mydb = mysql.connector.connect(
    host='localhost',
    user='root',
    password='VeniVidiVici4321',  # Put your MySQL password here
    port='3306',
    database='python_database',
)

mycursor = mydb.cursor()

mycursor.execute('SELECT * FROM users')

users = mycursor.fetchall()  # Returns a list of tuples (rows) of all users in database

for user in users:
    print(user)
    print('Username ' + user[1])

    print('Password ' + user[2])
