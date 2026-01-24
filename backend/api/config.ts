interface DatabaseConfig {
    host: string;
    port: string;
    user: string;
    password: string;
    bdname: string;
}

interface Config {
    ACCESS_TOKEN_SECRET: string;
    BDD: DatabaseConfig;
}

const config: Config = {
  ACCESS_TOKEN_SECRET: "EMMA123",
  BDD: {
    host: "dpg-d5el6dp5pdvs73fju1sg-a.oregon-postgres.render.com",
    port: "5432",
    user: "pollution_o536_user",
    password: "DJY36Fr9hi2gySAnHO4SvvqFOx90eu99",
    bdname: "pollution_o536"
  }

};



export default config;