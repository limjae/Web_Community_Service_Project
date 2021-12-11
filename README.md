# Web_Community_Service_Project  
sns like project ~2021-12-12
-------------------------  
  
you must set up ./config/config.json    
{  
  "development": {  
    "username": "root",  
    "password": "root",  
    "database": "database",  
    "host": "127.0.0.1",  
    "dialect": "mysql",  
    "logging": false  
  },  
  "test": {  
    "username": "root",  
    "password": null,  
    "database": "database_test",  
    "host": "127.0.0.1",  
    "dialect": "mysql"  
  },  
  "production": {  
    "username": "root",  
    "password": null,  
    "database": "database_production",  
    "host": "127.0.0.1",  
    "dialect": "mysql"  
  }  
}  
    
and .env  
COOKIE_SECRET=  
NODEMAILER_USER=  
NODEMAILER_PASS=  

