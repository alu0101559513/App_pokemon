/**
 * @file mongoose.ts
 * @description Configuración de la conexión a la base de datos MongoDB
 *
 * Este archivo se ejecuta automáticamente al importarse y establece
 * la conexión con el servidor MongoDB usando Mongoose.
 *
 * @requires mongoose - ODM para MongoDB
 */

import { connect } from 'mongoose';

/**
 * Conexión a MongoDB
 * URL obtenida de variable de entorno: MONGODB_URL
 * Se registran logs de éxito o error en la consola
 */
try {
  await connect(process.env.MONGODB_URL!);
  console.log('Connection to MongoDB server established');
} catch (error) {
  console.log(error);
}
