// controllers/accountController.js
const bcrypt = require('bcryptjs');
const { query } = require('../database');

// Mostrar formulario de inicio de sesión
exports.showLoginForm = (req, res) => {
  res.render('account/login', {
    title: 'Iniciar Sesión',
    errors: null,
    message: req.session.message,
    messageType: req.session.messageType,
    formData: {}
  });
};

// Procesar inicio de sesión
exports.login = async (req, res) => {
  try {
    const { account_email, account_password } = req.body;
    
    // Validaciones básicas
    if (!account_email || !account_password) {
      req.session.message = 'Por favor ingresa tu correo y contraseña';
      req.session.messageType = 'danger';
      return res.redirect('/login');
    }

    // Buscar usuario en la base de datos
    const result = await query(
      'SELECT * FROM account WHERE account_email = $1',
      [account_email]
    );

    if (result.rows.length === 0) {
      req.session.message = 'Correo o contraseña incorrectos';
      req.session.messageType = 'danger';
      return res.redirect('/login');
    }

    const user = result.rows[0];

    // Verificar contraseña
    const isMatch = await bcrypt.compare(account_password, user.account_password);
    if (!isMatch) {
      req.session.message = 'Correo o contraseña incorrectos';
      req.session.messageType = 'danger';
      return res.redirect('/login');
    }

    // Guardar usuario en la sesión (sin la contraseña)
    delete user.account_password;
    req.session.user = user;

    // Redirigir a la página de destino o al dashboard
    const redirectTo = req.session.returnTo || '/account';
    delete req.session.returnTo;
    
    req.session.message = '¡Bienvenido de nuevo!';
    req.session.messageType = 'success';
    return res.redirect(redirectTo);

  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    req.session.message = 'Error al iniciar sesión. Por favor, inténtalo de nuevo.';
    req.session.messageType = 'danger';
    return res.redirect('/login');
  }
};

// Mostrar formulario de registro
exports.showRegisterForm = (req, res) => {
  res.render('account/register', {
    title: 'Registrarse',
    errors: null,
    message: req.session.message,
    messageType: req.session.messageType,
    formData: {}
  });
};

// Procesar registro
exports.register = async (req, res) => {
  try {
    const { account_firstname, account_lastname, account_email, account_password } = req.body;

    // Validaciones básicas
    if (!account_firstname || !account_lastname || !account_email || !account_password) {
      req.session.message = 'Todos los campos son obligatorios';
      req.session.messageType = 'danger';
      return res.redirect('/register');
    }

    // Verificar si el correo ya existe
    const existingUser = await query(
      'SELECT * FROM account WHERE account_email = $1',
      [account_email]
    );

    if (existingUser.rows.length > 0) {
      req.session.message = 'El correo electrónico ya está registrado';
      req.session.messageType = 'danger';
      return res.redirect('/register');
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(account_password, salt);

    // Crear el usuario
    const result = await query(
      'INSERT INTO account (account_firstname, account_lastname, account_email, account_password, account_role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [account_firstname, account_lastname, account_email, hashedPassword, 'Client']
    );

    // Iniciar sesión automáticamente
    const user = result.rows[0];
    delete user.account_password;
    req.session.user = user;

    req.session.message = '¡Registro exitoso!';
    req.session.messageType = 'success';
    return res.redirect('/account');

  } catch (error) {
    console.error('Error en el registro:', error);
    req.session.message = 'Error al registrar el usuario. Por favor, inténtalo de nuevo.';
    req.session.messageType = 'danger';
    return res.redirect('/register');
  }
};

// Cerrar sesión
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
    }
    res.redirect('/login');
  });
};

// Mostrar panel de control
exports.showAccount = (req, res) => {
  res.render('account/index', {
    title: 'Mi Cuenta',
    user: req.session.user,
    message: req.session.message,
    messageType: req.session.messageType
  });
};

// Actualizar perfil
exports.updateProfile = async (req, res) => {
  try {
    const { account_firstname, account_lastname, account_email } = req.body;
    const userId = req.session.user.account_id;

    // Validaciones básicas
    if (!account_firstname || !account_lastname || !account_email) {
      req.session.message = 'Todos los campos son obligatorios';
      req.session.messageType = 'danger';
      return res.redirect('/account');
    }

    // Actualizar el perfil
    await query(
      'UPDATE account SET account_firstname = $1, account_lastname = $2, account_email = $3 WHERE account_id = $4',
      [account_firstname, account_lastname, account_email, userId]
    );

    // Actualizar datos en la sesión
    req.session.user.account_firstname = account_firstname;
    req.session.user.account_lastname = account_lastname;
    req.session.user.account_email = account_email;

    req.session.message = 'Perfil actualizado correctamente';
    req.session.messageType = 'success';
    return res.redirect('/account');

  } catch (error) {
    console.error('Error al actualizar el perfil:', error);
    req.session.message = 'Error al actualizar el perfil. Por favor, inténtalo de nuevo.';
    req.session.messageType = 'danger';
    return res.redirect('/account');
  }
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;
    const userId = req.session.user.account_id;

    // Validaciones básicas
    if (!current_password || !new_password || !confirm_password) {
      req.session.message = 'Todos los campos son obligatorios';
      req.session.messageType = 'danger';
      return res.redirect('/account');
    }

    if (new_password !== confirm_password) {
      req.session.message = 'Las contraseñas no coinciden';
      req.session.messageType = 'danger';
      return res.redirect('/account');
    }

    // Obtener el usuario actual
    const result = await query(
      'SELECT * FROM account WHERE account_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      req.session.message = 'Usuario no encontrado';
      req.session.messageType = 'danger';
      return res.redirect('/account');
    }

    const user = result.rows[0];

    // Verificar la contraseña actual
    const isMatch = await bcrypt.compare(current_password, user.account_password);
    if (!isMatch) {
      req.session.message = 'La contraseña actual es incorrecta';
      req.session.messageType = 'danger';
      return res.redirect('/account');
    }

    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Actualizar la contraseña
    await query(
      'UPDATE account SET account_password = $1 WHERE account_id = $2',
      [hashedPassword, userId]
    );

    req.session.message = 'Contraseña actualizada correctamente';
    req.session.messageType = 'success';
    return res.redirect('/account');

  } catch (error) {
    console.error('Error al cambiar la contraseña:', error);
    req.session.message = 'Error al cambiar la contraseña. Por favor, inténtalo de nuevo.';
    req.session.messageType = 'danger';
    return res.redirect('/account');
  }
};