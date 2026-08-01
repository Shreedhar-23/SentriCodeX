def get_user(cursor, user_id):
    cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
    return cursor.fetchone()


def get_user_by_name(cursor, username):
    cursor.execute("SELECT * FROM users WHERE name = %s" % username)
    return cursor.fetchone()
