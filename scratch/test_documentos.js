const http = require('http');

const API_URL = 'http://localhost:8080/api/v1';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING DOCUMENTS API TESTS ---');

  // 1. LOGIN AS ADMIN
  console.log('\n1. Logging in as admin...');
  const loginRes = await request('POST', '/auth/login', {
    email: 'admin@unitru.edu.pe',
    password: 'Admin2024!'
  });

  if (loginRes.status !== 200) {
    console.error('Login failed:', loginRes);
    process.exit(1);
  }
  
  const adminToken = loginRes.data.data.accessToken;
  console.log('Admin login successful!');

  // 2. CREATE TIPO DOCUMENTO WITH requiere_aprobacion = true
  console.log('\n2. Creating Document Type with requiere_aprobacion = true...');
  const typeCode = 'T-' + Math.floor(Math.random() * 1000);
  const typeRes = await request('POST', '/tipos-documento', {
    codigo: typeCode,
    nombre: `Tipo Test ${typeCode}`,
    descripcion: 'Tipo de prueba con requiere aprobacion',
    activo: true,
    requiere_aprobacion: true
  }, adminToken);

  if (typeRes.status !== 201) {
    console.error('Failed to create document type:', typeRes);
    process.exit(1);
  }
  const createdType = typeRes.data.data;
  console.log('Document Type created successfully:', {
    id: createdType.id,
    codigo: createdType.codigo,
    nombre: createdType.nombre,
    requiere_aprobacion: createdType.requiere_aprobacion
  });

  // 3. CREATE A DOCENTE USER
  console.log('\n3. Creating a Docente user...');
  const docenteEmail = `docente.${Math.floor(Math.random() * 10000)}@unitru.edu.pe`;
  const docentePassword = 'DocentePass123!';
  const createDocenteRes = await request('POST', '/usuarios', {
    codigo: 'DOC-' + Math.floor(Math.random() * 100000),
    nombre: 'Maria',
    apellido: 'Docente',
    email: docenteEmail,
    password: docentePassword,
    rol: 'docente'
  }, adminToken);

  if (createDocenteRes.status !== 201) {
    console.error('Failed to create docente:', createDocenteRes);
    process.exit(1);
  }
  console.log('Docente user created:', docenteEmail);

  // 4. CREATE A STUDENT USER
  console.log('\n4. Creating a Student user...');
  const estudianteEmail = `estudiante.${Math.floor(Math.random() * 10000)}@unitru.edu.pe`;
  const estudiantePassword = 'StudentPass123!';
  const createEstudianteRes = await request('POST', '/usuarios', {
    codigo: 'EST-' + Math.floor(Math.random() * 100000),
    nombre: 'Jose',
    apellido: 'Estudiante',
    email: estudianteEmail,
    password: estudiantePassword,
    rol: 'estudiante'
  }, adminToken);

  if (createEstudianteRes.status !== 201) {
    console.error('Failed to create estudiante:', createEstudianteRes);
    process.exit(1);
  }
  console.log('Student user created:', estudianteEmail);

  // 5. LOGIN AS DOCENTE
  console.log('\n5. Logging in as Docente...');
  const docenteLoginRes = await request('POST', '/auth/login', {
    email: docenteEmail,
    password: docentePassword
  });
  if (docenteLoginRes.status !== 200) {
    console.error('Docente login failed:', docenteLoginRes);
    process.exit(1);
  }
  const docenteToken = docenteLoginRes.data.data.accessToken;
  console.log('Docente login successful!');

  // 6. DOCENTE: LIST DOCUMENTS
  console.log('\n6. Docente listing documents...');
  const listDocsRes = await request('GET', '/documentos', null, docenteToken);
  if (listDocsRes.status !== 200) {
    console.error('Docente list documents failed:', listDocsRes);
    process.exit(1);
  }
  console.log(`Docente listed documents successfully. Total found: ${listDocsRes.data.meta.total}`);

  // 7. DOCENTE: CREATE DOCUMENT (tipo_id should be required)
  console.log('\n7. Docente creating document...');
  const docCode = 'D-TST-' + Math.floor(Math.random() * 100000);
  const createDocRes = await request('POST', '/documentos', {
    codigo: docCode,
    titulo: `Documento Prueba ${docCode}`,
    tipo_id: createdType.id,
    contenido: 'Contenido inicial en borrador'
  }, docenteToken);

  if (createDocRes.status !== 201) {
    console.error('Failed to create document as docente:', createDocRes);
    process.exit(1);
  }
  const createdDoc = createDocRes.data.data;
  console.log('Document created successfully:', {
    id: createdDoc.id,
    codigo: createdDoc.codigo,
    estado: createdDoc.estado
  });

  // 8. DOCENTE: UPDATE DOCUMENT (allowed in borrador)
  console.log('\n8. Docente updating document (while in borrador)...');
  const updateDocRes = await request('PUT', `/documentos/${createdDoc.id}`, {
    titulo: `Documento Prueba ${docCode} Modificado`,
    tipo_id: createdType.id,
    contenido: 'Contenido modificado en borrador',
    comentario_version: 'Primera edicion'
  }, docenteToken);

  if (updateDocRes.status !== 200) {
    console.error('Failed to update document as docente in borrador:', updateDocRes);
    process.exit(1);
  }
  console.log('Document updated successfully as docente!');

  // 9. DOCENTE: SEND TO REVISION
  console.log('\n9. Docente sending document to revision...');
  const transitionRes = await request('PATCH', `/documentos/${createdDoc.id}/estado`, {
    accion: 'enviar_revision',
    comentario: 'Listo para revision'
  }, docenteToken);

  if (transitionRes.status !== 200) {
    console.error('Failed to send document to revision:', transitionRes);
    process.exit(1);
  }
  console.log('Document transitioned to en_revision successfully!');

  // 10. DOCENTE: TRY TO UPDATE WHILE IN REVISION (should be blocked)
  console.log('\n10. Testing edit block as docente when document is in revision...');
  const updateBlockedRes = await request('PUT', `/documentos/${createdDoc.id}`, {
    titulo: `Documento Prueba ${docCode} Modificado Mas`,
    tipo_id: createdType.id,
    contenido: 'Contenido intentando editar en revision',
    comentario_version: 'Edicion ilegal'
  }, docenteToken);

  if (updateBlockedRes.status === 400) {
    console.log('Success: Edit was blocked with 400 Bad Request. Error:', updateBlockedRes.data.error.message);
  } else {
    console.error('Failure: Edit was NOT blocked. Response status:', updateBlockedRes.status, updateBlockedRes.data);
    process.exit(1);
  }

  // 11. LOGIN AS STUDENT
  console.log('\n11. Logging in as Student...');
  const estudianteLoginRes = await request('POST', '/auth/login', {
    email: estudianteEmail,
    password: estudiantePassword
  });
  if (estudianteLoginRes.status !== 200) {
    console.error('Student login failed:', estudianteLoginRes);
    process.exit(1);
  }
  const estudianteToken = estudianteLoginRes.data.data.accessToken;
  console.log('Student login successful!');

  // 12. STUDENT: TRY TO LIST DOCUMENTS (should be blocked)
  console.log('\n12. Testing student access block on GET /documentos...');
  const studentListRes = await request('GET', '/documentos', null, estudianteToken);
  if (studentListRes.status === 403) {
    console.log('Success: Access blocked with 403 Forbidden. Message:', studentListRes.data.error.message);
  } else {
    console.error('Failure: Student was NOT blocked. Response status:', studentListRes.status, studentListRes.data);
    process.exit(1);
  }

  console.log('\n--- ALL DOCUMENT TESTS PASSED SUCCESSFULLY ---');
}

runTests().catch(console.error);
