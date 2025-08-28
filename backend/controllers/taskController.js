const Task = require('../models/task');
const { createTaskSchema, updateTaskSchema } = require('../utils/taskValidators');
const ExcelJS = require('exceljs');
const XLSX = require('xlsx');

function findHeaderKey(headers, reList) {
  // headers: array of strings. reList: array of regex
  for (const h of headers) {
    for (const re of reList) {
      if (re.test(h.trim().toLowerCase())) return h;
    }
  }
  return null;
}

exports.createTask = async (req, res) => {
  try {
    const { error, value } = createTaskSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const task = await Task.create({
      title: value.title,
      description: value.description || '',
      effortDays: value.effortDays || 0,
      dueDate: value.dueDate || null,
      userId: req.user.id
    });

    return res.status(201).json({ task });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.listTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    return res.json({ tasks });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getTask = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const task = await Task.findOne({ where: { id, userId: req.user.id } });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    return res.json({ task });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { error, value } = updateTaskSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const task = await Task.findOne({ where: { id, userId: req.user.id } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await task.update(value);
    return res.json({ task });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const task = await Task.findOne({ where: { id, userId: req.user.id } });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await task.destroy();
    return res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Export tasks to Excel — supports ?asBase64=true to return JSON with base64 data
exports.exportTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Tasks');

    sheet.columns = [
      { header: 'Task Title', key: 'title', width: 40 },
      { header: 'Description', key: 'description', width: 60 },
      { header: 'Effort To Complete (In Days)', key: 'effortDays', width: 15 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 20 }
    ];

    tasks.forEach(t => {
      sheet.addRow({
        title: t.title,
        description: t.description,
        effortDays: t.effortDays,
        dueDate: t.dueDate ? (t.dueDate instanceof Date ? t.dueDate.toISOString().slice(0,10) : t.dueDate.toString()) : '',
        createdAt: t.createdAt ? t.createdAt.toISOString() : ''
      });
    });

    // If client requests base64 JSON (useful for clients that cannot handle binary)
    if (req.query.asBase64 === 'true') {
      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = buffer.toString('base64');
      return res.json({ filename: 'tasks.xlsx', data: base64 });
    }

    // Default: send binary .xlsx as file attachment
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks.xlsx');
    return res.send(buffer);
  } catch (err) {
    console.error('Export error:', err);
    return res.status(500).json({ message: 'Failed to export tasks' });
  }
};

// Upload bulk tasks (CSV or Excel)
// Expects multipart/form-data with field name "file"
exports.uploadTasks = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Parse buffer using xlsx (handles .xls .xlsx .csv)
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' }); // rows as objects

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({ message: 'File contains no rows' });
    }

    // Determine headers (keys)
    const headers = Object.keys(rawRows[0]);

    // Find keys for columns using heuristics (case-insensitive)
    const titleKey = findHeaderKey(headers, [/title/, /task\s*title/, /^title$/]);
    const descKey = findHeaderKey(headers, [/desc/, /description/]);
    const effortKey = findHeaderKey(headers, [/effort/, /days/, /effort\s*to\s*complete/]);
    const dueKey = findHeaderKey(headers, [/due/, /due\s*date/, /date/]);

    if (!titleKey) {
      return res.status(400).json({ message: 'Could not find a "Title" column in the uploaded file. Expected header like "Task Title" or "Title".' });
    }

    const validRows = [];
    const errors = [];

    rawRows.forEach((r, idx) => {
      const line = idx + 2; // +2 because header is line 1 in Excel
      const title = (r[titleKey] || '').toString().trim();
      if (!title) {
        errors.push({ line, reason: 'Missing Title' });
        return;
      }

      const description = (descKey && r[descKey] != null) ? r[descKey].toString() : '';
      const effortRaw = (effortKey && r[effortKey] != null) ? r[effortKey] : '';
      const dueRaw = (dueKey && r[dueKey] != null) ? r[dueKey] : '';

      // parse effortDays to integer (if possible)
      let effortDays = null;
      if (effortRaw !== '') {
        const parsed = parseInt(effortRaw, 10);
        if (Number.isNaN(parsed) || parsed < 0) {
          errors.push({ line, reason: 'Invalid Effort value' });
          return;
        }
        effortDays = parsed;
      } else {
        effortDays = 0;
      }

      // parse due date
      let dueDate = null;
      if (dueRaw !== '') {
        // dueRaw can be Date object (if cellDates true) or string or number (excel serial)
        let parsedDate = null;
        if (dueRaw instanceof Date && !Number.isNaN(dueRaw.getTime())) {
          parsedDate = dueRaw;
        } else {
          // try JS Date parse
          const candidate = new Date(dueRaw);
          if (!Number.isNaN(candidate.getTime())) parsedDate = candidate;
        }
        if (!parsedDate) {
          errors.push({ line, reason: `Invalid Due Date: ${dueRaw}` });
          return;
        }
        // store as yyyy-mm-dd
        const yyyy = parsedDate.getFullYear();
        const mm = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(parsedDate.getDate()).padStart(2, '0');
        dueDate = `${yyyy}-${mm}-${dd}`;
      }

      validRows.push({
        title,
        description,
        effortDays,
        dueDate
      });
    });

    // Create tasks in DB
    const created = [];
    if (validRows.length > 0) {
      const rowsToInsert = validRows.map(r => ({ ...r, userId: req.user.id }));
      // Use bulkCreate so it's faster
      const inserted = await Task.bulkCreate(rowsToInsert, { returning: true });
      inserted.forEach(i => created.push(i));
    }

    return res.json({
      message: `Upload processed. Created ${created.length} tasks, ${errors.length} rows skipped.`,
      createdCount: created.length,
      errors,
      created: created.map(c => ({ id: c.id, title: c.title }))
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ message: 'Failed to process uploaded file' });
  }
};
