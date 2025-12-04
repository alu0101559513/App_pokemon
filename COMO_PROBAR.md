
# Como Probar la API

## Endpoints Disponibles

### Obtener un Pokemon
```bash
curl http://localhost:3000/pokemon/pikachu
curl http://localhost:3000/pokemon/25
```

### Pokemon aleatorio
```bash
curl http://localhost:3000/pokemon/random
```

### Lista de Pokemon
```bash
curl "http://localhost:3000/pokemon/list?limit=5"
```

### Multiples Pokemon
```bash
curl -X POST http://localhost:3000/pokemon/multiple \
  -H "Content-Type: application/json" \
  -d '{"ids": [1, 4, 7, 25]}'
```

## Servidor

```bash
npm run dev
```

# Ejecutar BDD
```bash
npm run dev
sudo /home/lualeon/Escritorio/PracticasULL/SyTW/mongodb/bin/mongod --dbpath /home/lualeon/Escritorio/PracticasULL/SyTW/mongodb-data
```

# PROBAR REGISTRO E INICIO DE SESIÓN
### EJECUTAR TODO
```bash
npm run dev # En una terminal
sudo /home/lualeon/Escritorio/PracticasULL/SyTW/mongodb/bin/mongod --dbpath /home/lualeon/Escritorio/PracticasULL/SyTW/mongodb-data # En otra terminal (usa tu ruta, no la mía xD)
npm run dev-client # En otra terminal
```

## A partir de aquí existen varias maneras:
### Por Postman
```bash
POST http://localhost:3000/users/register
# body:
# {
#  "username": "testuser123",
#  "email": "testuser@example.com",
#  "password": "password123",
#  "confirmPassword": "password123"
# }
```

### POR EL NAVEGADOR (CLAVE)
Simplemente resuelve el cuestionario del navegador en la página web del front end

## Luego, comprobamos que se crearon correctamente con un get simplito
```bash
GET http://localhost:3000/users
```

## También puedes probarlo INICIANDO SESIÓN
### Por Postman
```bash
POST http://localhost:3000/users/login
# body:
# {
#   "username": "testuser123",
#   "password": "password123"
# }
# También puedes usar email en vez de username!
```

### Por Navegador
Resolviendo el formulario de la página!