import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// import expressLayouts from 'express-ejs-layouts';
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import dotenv from 'dotenv';
import { 
  
} from './db/services.js';

dotenv.config();

// Recreate __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// app.use(expressLayouts);
// app.set('layout', './layouts/full-width');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler

// error handler
// error handler
app.use((err, req, res, next) => {
  console.error(err);  // <-- log the full error object
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

export default app;
