# Migrator

## How to use

- Docker

```bash
# Export
docker run --rm -v ./data/:/app/data migrator:latest --uri "mongodb://myusername:mypassword@172.17.0.1:27017/fastgpt?directConnection=true&authSource=admin" --mode=export --teamId=672b33d12de6d62638cc9df7
# Export & Rewrite teamId & tmbId
docker run --rm -v ./data/:/app/data migrator:latest --uri "mongodb://myusername:mypassword@localhost:27017/fastgpt?directConnection=true&authSource=admin" --mode=exportRewrite --teamId=672b33d12de6d62638cc9df7 --newTeamId=672b33d12de6d62638cc9df8 --newTmbId=672b33d12de6d62638cc9df9
# Import
docker run --rm -v ./data/:/app/data migrator:latest --uri "mongodb://myusername:mypassword@localhost:27017/fastgpt?directConnection=true&authSource=admin" --mode=import
```
