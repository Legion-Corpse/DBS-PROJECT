const oracledb = require('oracledb');
(async function() {
    let conn;
    try {
        conn = await oracledb.getConnection({
            user: 'marketplace',
            password: 'market123',
            connectionString: 'localhost:1521/xe'
        });
        const res = await conn.execute("SELECT constraint_name, search_condition FROM user_constraints WHERE table_name = 'SERVICE_PROVIDERS'");
        console.log(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        if (conn) await conn.close();
    }
})();
