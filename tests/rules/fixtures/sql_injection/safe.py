def get_user(cursor, user_id):
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    return cursor.fetchone()


def get_user_multiline(cursor, user_id):
    cursor.execute(
        "SELECT * FROM users WHERE id = %s",
        (user_id,),
    )
    return cursor.fetchone()
