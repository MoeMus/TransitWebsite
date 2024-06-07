import mysql.connector

mydb = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',  # Put your MySQL password here
    port='3306',
    database='python_database',
)

mycursor = mydb.cursor()

mycursor.execute('SELECT * FROM users')

users = mycursor.fetchall()  # Returns a list of tuples (rows) of all users in database

for user in users:
    print(user)
    print('Password ' + user[1])
