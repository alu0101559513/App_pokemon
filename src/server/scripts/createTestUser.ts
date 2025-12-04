import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config({ path: './config/dev.env' });

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Usuario ya existe:', existingUser.email);
      await mongoose.connection.close();
      return;
    }

    // Crear nueva contraseña hasheada
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Test123456', salt);

    // Crear nuevo usuario
    const newUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      profileImage: 'https://via.placeholder.com/150',
      settings: {
        language: 'es',
        darkMode: false,
        notifications: {
          trades: true,
          messages: true,
          friendRequests: true
        },
        privacy: {
          showCollection: true,
          showWishlist: true
        }
      }
    });

    const savedUser = await newUser.save();
    console.log(' Usuario creado exitosamente:');
    console.log('   Email: test@example.com');
    console.log('   Usuario: testuser');
    console.log('   Contraseña: Test123456');
    console.log('   ID:', savedUser._id);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error al crear usuario:', error);
    process.exit(1);
  }
}

createTestUser();
