export const setupSql = `
    CREATE TABLE IF NOT EXISTS messages_crdt
    (
        hlc
        TEXT
        NOT
        NULL
        PRIMARY
        KEY,
        dataset
        TEXT
        NOT
        NULL,
        rowId
        TEXT
        NOT
        NULL,
        batchId
        TEXT
        NOT
        NULL,
        col
        TEXT
        NOT
        NULL,
        val
        BLOB
        NOT
        NULL,
        actor
        TEXT
        NOT
        NULL
    );

    CREATE INDEX IF NOT EXISTS messages_crdt_dataset_index ON messages_crdt (dataset, rowId, col);
    CREATE INDEX IF NOT EXISTS messages_crdt_batchId_index ON messages_crdt (batchId);

    CREATE TABLE IF NOT EXISTS events
    (
        id
        TEXT
        PRIMARY
        KEY
        NOT
        NULL,
        name
        TEXT,
        maxTickets
        INTEGER,
        tombstone
        BOOLEAN
        NOT
        NULL
        DEFAULT
        0
    );

    CREATE TABLE IF NOT EXISTS students
    (
        sid
        TEXT,
        name
        TEXT,
        eventId
        TEXT,
        tombstone
        BOOLEAN
        NOT
        NULL
        DEFAULT
        0,
        FOREIGN
        KEY
    (
        eventId
    ) REFERENCES events
    (
        id
    ),
        primary key
    (
        sid,
        eventId
    )
        );

    CREATE TABLE IF NOT EXISTS admins
    (
        id
        TEXT
        PRIMARY
        KEY
        NOT
        NULL,
        name
        TEXT,
        eventId
        TEXT,
        tombstone
        BOOLEAN
        NOT
        NULL
        DEFAULT
        0,
        FOREIGN
        KEY
    (
        eventId
    ) REFERENCES events
    (
        id
    )
        );

    CREATE TABLE IF NOT EXISTS tickets
    (
        id
        TEXT
        PRIMARY
        KEY
        NOT
        NULL,
        studentSid
        TEXT,
        eventId
        TEXT,
        redeemed
        BOOLEAN
        NOT
        NULL
        DEFAULT
        0,
        tombstone
        BOOLEAN
        NOT
        NULL
        DEFAULT
        0,
        FOREIGN
        KEY
    (
        studentSid,
        eventId
    ) REFERENCES students
    (
        sid,
        eventId
    )
        );

    CREATE INDEX IF NOT EXISTS ticket_studentSid_eventId_index ON tickets (studentSid,eventId);

    CREATE TABLE IF NOT EXISTS access_student_logs
    (
        id
        TEXT
        PRIMARY
        KEY
        NOT
        NULL,
        studentSid
        TEXT,
        eventId
        TEXT,
        adminId,
        TEXT,
        timestamp
        TEXT,
        FOREIGN
        KEY
    (
        studentSid,
        eventId
    ) REFERENCES students
    (
        sid,
        eventId
    )
        );

    CREATE INDEX IF NOT EXISTS access_student_log_studentSid_eventId_index ON access_student_logs (studentSid, eventId);
    CREATE INDEX IF NOT EXISTS access_student_log_adminId_index ON access_student_logs (adminId);
`;
