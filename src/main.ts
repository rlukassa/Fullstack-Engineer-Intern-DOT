import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { engine } from 'express-handlebars';
import session = require('express-session');
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'train-booking-secret-key-2024',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      },
    }),
  );
  
  // View engine setup with express-handlebars
  const viewsPath = join(__dirname, '..', 'src', 'views');
  const publicPath = join(__dirname, '..', 'public');
  
  app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: join(viewsPath, 'layouts'),
    partialsDir: join(viewsPath, 'partials'),
    helpers: {
      eq: function(a: any, b: any) {
        return a === b;
      },
      formatDate: function(date: Date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      },
      formatPrice: function(price: number) {
        if (!price) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0
        }).format(price);
      }
    }
  }));
  
  app.setBaseViewsDir(viewsPath);
  app.setViewEngine('hbs');
  app.useStaticAssets(publicPath);
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
