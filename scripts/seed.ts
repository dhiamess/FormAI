/**
 * Script de seed pour données initiales
 *
 * Usage: npx ts-node scripts/seed.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Inline models to avoid dependency on compiled code
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'manager', 'user'], default: 'user' },
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  isActive: { type: Boolean, default: true },
  preferences: {
    language: { type: String, default: 'fr' },
    theme: { type: String, default: 'light' },
    notifications: { type: Boolean, default: true },
  },
}, { timestamps: true });

const OrganizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  plan: { type: String, default: 'free' },
  settings: {
    maxForms: { type: Number, default: 10 },
    maxUsers: { type: Number, default: 5 },
    maxSubmissions: { type: Number, default: 1000 },
    defaultAIProvider: { type: String, default: 'claude' },
  },
}, { timestamps: true });

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  permissions: {
    forms: { create: Boolean, read: Boolean, update: Boolean, delete: Boolean, publish: Boolean },
    submissions: { read: Boolean, export: Boolean, delete: Boolean },
    users: { manage: Boolean },
    settings: { manage: Boolean },
  },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const FormSchema = new mongoose.Schema({
  name: String,
  slug: String,
  description: String,
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'draft' },
  version: { type: Number, default: 1 },
  versions: [mongoose.Schema.Types.Mixed],
  schema: mongoose.Schema.Types.Mixed,
  collectionName: String,
  accessControl: {
    viewGroups: [mongoose.Schema.Types.ObjectId],
    submitGroups: [mongoose.Schema.Types.ObjectId],
    manageGroups: [mongoose.Schema.Types.ObjectId],
    isPublic: { type: Boolean, default: false },
  },
  integrations: [mongoose.Schema.Types.Mixed],
  analytics: {
    totalSubmissions: { type: Number, default: 0 },
    lastSubmission: Date,
    avgCompletionTime: { type: Number, default: 0 },
  },
  aiPromptHistory: [mongoose.Schema.Types.Mixed],
  publishedAt: Date,
}, { timestamps: true });

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/formai';
  console.log(`Connecting to MongoDB: ${uri}`);

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const Organization = mongoose.model('Organization', OrganizationSchema);
  const User = mongoose.model('User', UserSchema);
  const Group = mongoose.model('Group', GroupSchema);
  const Form = mongoose.model('Form', FormSchema);

  // Clear existing data
  await Promise.all([
    Organization.deleteMany({}),
    User.deleteMany({}),
    Group.deleteMany({}),
    Form.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // 1. Create organization
  const org = await Organization.create({
    name: 'Demo Corp',
    slug: 'demo-corp',
    plan: 'pro',
    settings: {
      maxForms: 100,
      maxUsers: 50,
      maxSubmissions: 10000,
      defaultAIProvider: 'claude',
    },
  });
  console.log('Created organization: Demo Corp');

  // 2. Create groups
  const adminGroup = await Group.create({
    name: 'Administrateurs',
    description: 'Accès complet à toutes les fonctionnalités',
    organization: org._id,
    permissions: {
      forms: { create: true, read: true, update: true, delete: true, publish: true },
      submissions: { read: true, export: true, delete: true },
      users: { manage: true },
      settings: { manage: true },
    },
  });

  const managerGroup = await Group.create({
    name: 'Managers',
    description: 'Gestion des formulaires et soumissions',
    organization: org._id,
    permissions: {
      forms: { create: true, read: true, update: true, delete: false, publish: true },
      submissions: { read: true, export: true, delete: false },
      users: { manage: false },
      settings: { manage: false },
    },
  });

  const userGroup = await Group.create({
    name: 'Utilisateurs',
    description: 'Accès en lecture et soumission',
    organization: org._id,
    permissions: {
      forms: { create: false, read: true, update: false, delete: false, publish: false },
      submissions: { read: true, export: false, delete: false },
      users: { manage: false },
      settings: { manage: false },
    },
  });
  console.log('Created 3 groups');

  // 3. Create superadmin
  // Password: Admin123! (hashed with bcrypt)
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.hash('Admin123!', 12);

  const superadmin = await User.create({
    email: 'admin@formai.dev',
    passwordHash: hashedPassword,
    firstName: 'Super',
    lastName: 'Admin',
    role: 'superadmin',
    organization: org._id,
    groups: [adminGroup._id],
  });

  // Create test users
  const testUsers = [
    { email: 'marie@demo.com', firstName: 'Marie', lastName: 'Dupont', role: 'admin', group: adminGroup },
    { email: 'jean@demo.com', firstName: 'Jean', lastName: 'Martin', role: 'admin', group: adminGroup },
    { email: 'pierre@demo.com', firstName: 'Pierre', lastName: 'Bernard', role: 'manager', group: managerGroup },
    { email: 'sophie@demo.com', firstName: 'Sophie', lastName: 'Robert', role: 'manager', group: managerGroup },
    { email: 'paul@demo.com', firstName: 'Paul', lastName: 'Richard', role: 'manager', group: managerGroup },
    { email: 'claire@demo.com', firstName: 'Claire', lastName: 'Petit', role: 'user', group: userGroup },
    { email: 'lucas@demo.com', firstName: 'Lucas', lastName: 'Durand', role: 'user', group: userGroup },
    { email: 'emma@demo.com', firstName: 'Emma', lastName: 'Leroy', role: 'user', group: userGroup },
  ];

  for (const u of testUsers) {
    const user = await User.create({
      email: u.email,
      passwordHash: hashedPassword,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      organization: org._id,
      groups: [u.group._id],
    });
    u.group.members.push(user._id);
  }

  adminGroup.members.push(superadmin._id);
  await Promise.all([adminGroup.save(), managerGroup.save(), userGroup.save()]);
  console.log('Created 9 users (1 superadmin + 8 test users)');

  // 4. Create sample forms
  const simpleForm = await Form.create({
    name: 'Formulaire de contact',
    slug: 'contact-demo',
    description: 'Formulaire de contact simple pour le site web',
    organization: org._id,
    createdBy: superadmin._id,
    status: 'published',
    version: 1,
    schema: {
      fields: [
        { id: 'f1', type: 'text', label: 'Nom complet', name: 'nom_complet', required: true, layout: { column: 1, row: 1, width: 6 } },
        { id: 'f2', type: 'email', label: 'Email', name: 'email', required: true, layout: { column: 7, row: 1, width: 6 } },
        { id: 'f3', type: 'phone', label: 'Téléphone', name: 'telephone', required: false, layout: { column: 1, row: 2, width: 6 } },
        { id: 'f4', type: 'select', label: 'Sujet', name: 'sujet', required: true, options: [
          { label: 'Question générale', value: 'general' },
          { label: 'Support technique', value: 'support' },
          { label: 'Partenariat', value: 'partenariat' },
        ], layout: { column: 7, row: 2, width: 6 } },
        { id: 'f5', type: 'textarea', label: 'Message', name: 'message', required: true, layout: { column: 1, row: 3, width: 12 } },
      ],
      layout: { type: 'single' },
      settings: {
        submitButtonText: 'Envoyer',
        successMessage: 'Merci pour votre message ! Nous vous répondrons rapidement.',
        allowMultipleSubmissions: true,
        requireAuth: false,
        notifyOnSubmission: ['admin@formai.dev'],
        autoSave: false,
        theme: { primaryColor: '#2563eb', fontFamily: 'Inter', borderRadius: '8px' },
      },
    },
    collectionName: 'form_contact_submissions',
    accessControl: { viewGroups: [], submitGroups: [], manageGroups: [], isPublic: true },
    publishedAt: new Date(),
  });

  const complexForm = await Form.create({
    name: 'Demande de congé',
    slug: 'demande-conge-demo',
    description: 'Formulaire multi-étapes de demande de congé',
    organization: org._id,
    createdBy: superadmin._id,
    status: 'published',
    version: 1,
    schema: {
      fields: [
        { id: 'c1', type: 'heading', label: 'Informations de l\'employé', name: 'heading_employe', required: false, layout: { column: 1, row: 1, width: 12 } },
        { id: 'c2', type: 'text', label: 'Nom de l\'employé', name: 'nom_employe', required: true, layout: { column: 1, row: 2, width: 6 } },
        { id: 'c3', type: 'text', label: 'Matricule', name: 'matricule', required: true, layout: { column: 7, row: 2, width: 6 } },
        { id: 'c4', type: 'text', label: 'Département', name: 'departement', required: true, layout: { column: 1, row: 3, width: 6 } },
        { id: 'c5', type: 'heading', label: 'Détails du congé', name: 'heading_conge', required: false, layout: { column: 1, row: 4, width: 12 } },
        { id: 'c6', type: 'radio', label: 'Type de congé', name: 'type_conge', required: true, options: [
          { label: 'Vacances', value: 'vacances' },
          { label: 'Maladie', value: 'maladie' },
          { label: 'Personnel', value: 'personnel' },
          { label: 'Formation', value: 'formation' },
        ], layout: { column: 1, row: 5, width: 12 } },
        { id: 'c7', type: 'date', label: 'Date de début', name: 'date_debut', required: true, layout: { column: 1, row: 6, width: 6 } },
        { id: 'c8', type: 'date', label: 'Date de fin', name: 'date_fin', required: true, layout: { column: 7, row: 6, width: 6 } },
        { id: 'c9', type: 'number', label: 'Nombre de jours', name: 'nombre_jours', required: true, validation: { min: 0.5, max: 30 }, layout: { column: 1, row: 7, width: 6 } },
        { id: 'c10', type: 'textarea', label: 'Commentaires', name: 'commentaires', required: false, layout: { column: 1, row: 8, width: 12 } },
      ],
      layout: {
        type: 'multi-step',
        steps: [
          { title: 'Informations', fields: ['c1', 'c2', 'c3', 'c4'] },
          { title: 'Congé', fields: ['c5', 'c6', 'c7', 'c8', 'c9', 'c10'] },
        ],
      },
      settings: {
        submitButtonText: 'Soumettre la demande',
        successMessage: 'Votre demande de congé a été soumise. Vous recevrez une réponse par email.',
        allowMultipleSubmissions: true,
        requireAuth: true,
        notifyOnSubmission: ['admin@formai.dev'],
        autoSave: true,
        theme: { primaryColor: '#7c3aed', fontFamily: 'Inter', borderRadius: '8px' },
      },
    },
    collectionName: 'form_conge_submissions',
    accessControl: { viewGroups: [], submitGroups: [], manageGroups: [], isPublic: false },
    publishedAt: new Date(),
  });
  console.log('Created 2 sample forms');

  // 5. Create sample submissions
  const contactSubmissions = mongoose.connection.collection('form_contact_submissions');
  await contactSubmissions.insertMany([
    {
      formId: simpleForm._id,
      formVersion: 1,
      data: { nom_complet: 'Alice Tremblay', email: 'alice@example.com', sujet: 'general', message: 'Bonjour, j\'ai une question.' },
      metadata: { submittedAt: new Date(), source: 'web' },
      status: 'submitted',
      isTestSubmission: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      formId: simpleForm._id,
      formVersion: 1,
      data: { nom_complet: 'Bob Gagnon', email: 'bob@example.com', telephone: '514-555-1234', sujet: 'support', message: 'J\'ai un problème technique.' },
      metadata: { submittedAt: new Date(), source: 'web' },
      status: 'reviewed',
      isTestSubmission: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  console.log('Created sample submissions');

  console.log('\n=== Seed complete ===');
  console.log('Superadmin: admin@formai.dev / Admin123!');
  console.log('Test users: (any)@demo.com / Admin123!');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
