const oracledb = require('oracledb');
(async function() {
    let conn;
    try {
        conn = await oracledb.getConnection({
            user: 'marketplace',
            password: 'market123',
            connectionString: 'localhost:1521/xe'
        });
        const res = await conn.execute("SELECT provider_id, username, full_name, category_name, rating_avg, jobs_completed FROM vw_provider_summary", [], {outFormat: oracledb.OUT_FORMAT_OBJECT});
        console.log(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        if (conn) await conn.close();
    }
})();
