const oracledb = require('oracledb');
(async function() {
    let conn;
    try {
        conn = await oracledb.getConnection({
            user: 'marketplace',
            password: 'market123',
            connectionString: 'localhost:1521/xe'
        });
        const res = await conn.execute("SELECT * FROM vw_provider_summary WHERE provider_id = :1", [NaN]);
        console.log(res.rows);
    } catch (e) {
        console.error("error NaN", e);
    } finally {
        if (conn) await conn.close();
    }
})();
