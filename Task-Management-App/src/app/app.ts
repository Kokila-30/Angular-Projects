import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Task, UserProfile } from './types';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class AppComponent implements OnInit {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('editFileInput') editFileInputRef!: ElementRef<HTMLInputElement>;

  private readonly USER_STORAGE_KEY = 'taskflow_user';

  currentUser: UserProfile | null = null;
  tasks: Task[] = [];

  // Signup Form Properties
  signupName = '';
  signupEmail = '';
  signupNameError = '';
  signupEmailError = '';
  signupAvatarPreview: string | null = null;
  signupAvatarFile: File | null = null;

  // Create Form
  newTitle = '';
  newDesc = '';
  newPriority: 'Low' | 'Medium' | 'High' = 'Medium';
  newDeadline = '';
  newFiles: File[] = [];
  titleError = '';
  descError = '';
  dupWarning = '';

  // Drag & Drop
  draggedTaskId: string | null = null;

  // Edit Modal
  showEditModal = false;
  editingTaskId: string | null = null;
  editTitle = '';
  editDesc = '';
  editPriority: 'Low' | 'Medium' | 'High' = 'Medium';
  editDeadline = '';
  editFiles: File[] = [];
  editCurrentImages: string[] = [];

  // Delete Modal
  showDeleteModal = false;
  pendingDeleteId: string | null = null;

  // Task Module
  showTaskModule = false;
  moduleTaskId: string | null = null;

  // Filters & Sort
  activeSearch = '';
  searchInput = '';
  activeStatus = 'all';
  activePriority = 'all';
  activeSort = 'none';
  sortSelectValue = 'none';

  // Lightbox
  showLightbox = false;
  lightTaskId: string | null = null;
  lightIndex = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadUser();
    this.loadTasks();
  }

  private getStorageKey(): string {
    if (!this.currentUser || !this.currentUser.email) {
      return 'taskflow_ng_board_temp';
    }
    return `taskflow_ng_board_${this.currentUser.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  private loadUser(): void {
    try {
      const raw = localStorage.getItem(this.USER_STORAGE_KEY);
      if (raw) {
        this.currentUser = JSON.parse(raw) as UserProfile;
        console.log('User loaded:', this.currentUser);
      }
    } catch {
      this.currentUser = null;
    }
  }

  validateSignupName(): void {
    if (!this.signupName.trim()) {
      this.signupNameError = 'Name is required';
    } else if (this.signupName.trim().length < 2) {
      this.signupNameError = 'Name must be at least 2 characters';
    } else {
      this.signupNameError = '';
    }
  }

  validateSignupEmail(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.signupEmail.trim()) {
      this.signupEmailError = 'Email is required';
    } else if (!emailRegex.test(this.signupEmail)) {
      this.signupEmailError = 'Please enter a valid email';
    } else {
      this.signupEmailError = '';
    }
  }

  isSignupFormValid(): boolean {
    return (
      !this.signupNameError &&
      !this.signupEmailError &&
      this.signupName.trim() !== '' &&
      this.signupEmail.trim() !== ''
    );
  }

  onSignupAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.signupAvatarFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.signupAvatarPreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.signupAvatarFile);
    }
  }

  doSignup(): void {
    if (!this.isSignupFormValid()) {
      return;
    }

    const user: UserProfile = {
      name: this.signupName.trim(),
      email: this.signupEmail.trim(),
      avatar: this.signupAvatarPreview,
      loggedInAt: new Date().toISOString(),
    };

    localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
    this.currentUser = user;

    this.signupName = '';
    this.signupEmail = '';
    this.signupNameError = '';
    this.signupEmailError = '';
    this.signupAvatarPreview = null;
    this.signupAvatarFile = null;

    this.loadTasks();
  }

  logout(): void {
    if (confirm('Are you sure you want to logout? Your tasks will be saved.')) {
      localStorage.removeItem(this.USER_STORAGE_KEY);
      this.currentUser = null;
      this.tasks = [];
    }
  }

  validateTitle(): boolean {
    if (!this.newTitle.trim()) {
      this.titleError = '⚠️ Title is required';
      return false;
    }
    this.titleError = '';
    return true;
  }

  validateDesc(): boolean {
    if (!this.newDesc.trim()) {
      this.descError = '⚠️ Description is required';
      return false;
    }
    this.descError = '';
    return true;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      if (files.length > 5) {
        alert('Maximum 5 images allowed. Only first 5 will be uploaded.');
        this.newFiles = files.slice(0, 5);
      } else {
        this.newFiles = files;
      }
      console.log('Selected files for creation:', this.newFiles.length);
    }
  }

  async addTask(): Promise<void> {
    const tValid = this.validateTitle();
    const dValid = this.validateDesc();
    if (!tValid || !dValid) return;

    if (this.isDuplicate(this.newTitle)) {
      this.dupWarning = 'Duplicate title!';
      setTimeout(() => (this.dupWarning = ''), 2000);
      return;
    }

    const images = this.newFiles.length ? await this.readFilesAsDataURL(this.newFiles) : [];

    this.tasks.push({
      id: this.genId(),
      title: this.newTitle.trim(),
      description: this.newDesc.trim(),
      priority: this.newPriority,
      deadline: this.newDeadline ? this.newDeadline : null,
      attachments: images,
      status: 'todo',
      createdTime: new Date().toISOString(),
      expanded: false,
    });

    this.saveTasks();
    this.resetCreateForm();
  }

  private resetCreateForm(): void {
    this.newTitle = '';
    this.newDesc = '';
    this.newPriority = 'Medium';
    this.newDeadline = '';
    this.newFiles = [];
    this.titleError = '';
    this.descError = '';
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  get totalCount(): number {
    return this.tasks.length;
  }
  get todoCount(): number {
    return this.tasks.filter((t) => t.status === 'todo').length;
  }
  get progressCount(): number {
    return this.tasks.filter((t) => t.status === 'inprogress').length;
  }
  get doneCount(): number {
    return this.tasks.filter((t) => t.status === 'done').length;
  }

  get completionPercent(): number {
    return this.totalCount === 0 ? 0 : Math.round((this.doneCount / this.totalCount) * 100);
  }

  get moduleTask(): Task | null {
    return this.tasks.find((t) => t.id === this.moduleTaskId) || null;
  }

  openTaskModule(id: string): void {
    this.moduleTaskId = id;
    this.showTaskModule = true;
  }

  closeTaskModule(): void {
    this.showTaskModule = false;
    this.moduleTaskId = null;
  }

  doSearch(): void {
    this.activeSearch = this.searchInput.trim();
  }

  clearSearch(): void {
    this.searchInput = '';
    this.activeSearch = '';
  }

  private saveTasks(): void {
    try {
      const key = this.getStorageKey();
      localStorage.setItem(key, JSON.stringify(this.tasks));
      console.log(`Tasks saved for user ${this.currentUser?.email}:`, this.tasks.length);
    } catch (e) {
      console.error(e);
    }
  }

  private loadTasks(): void {
    if (!this.currentUser) {
      this.tasks = [];
      return;
    }

    try {
      const key = this.getStorageKey();
      const raw = localStorage.getItem(key);

      if (raw && raw !== 'undefined' && raw !== 'null') {
        const parsed = JSON.parse(raw);
        this.tasks = Array.isArray(parsed) ? parsed : [];

        this.tasks.forEach((t) => {
          t.attachments = t.attachments || [];
          t.status = t.status || 'todo';
          t.priority = t.priority || 'Medium';
          t.createdTime = t.createdTime || new Date().toISOString();
          t.expanded = false;

          if (t.deadline && !t.deadline.includes('T') && !t.deadline.includes('t')) {
            t.deadline = t.deadline + 'T12:00';
          }
        });

        console.log(`Loaded ${this.tasks.length} tasks`);
      } else {
        this.tasks = [];
      }
    } catch {
      this.tasks = [];
    }
  }

  genId(): string {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 8);
  }

  isDuplicate(title: string, excludeId: string | null = null): boolean {
    return this.tasks.some(
      (t) => t.title.trim().toLowerCase() === title.trim().toLowerCase() && t.id !== excludeId,
    );
  }

  isExpired(task: Task): boolean {
    if (task.status === 'done' || !task.deadline) return false;

    const now = new Date();

    let deadlineDate: Date;

    if (task.deadline.includes('T')) {
      const [datePart, timePart] = task.deadline.split('T');
      const [year, month, day] = datePart.split('-');
      const [hour, minute] = timePart.split(':');
      deadlineDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
      );
    } else {
      const [year, month, day] = task.deadline.split('-');
      deadlineDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59);
    }

    if (isNaN(deadlineDate.getTime())) return false;

    return deadlineDate < now;
  }

  formatDate(iso: string | null, defaultValue = 'No deadline'): string {
    if (!iso) return defaultValue;

    let dateStr = iso;
    if (iso.includes('T')) {
      dateStr = iso.split('T')[0];
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return defaultValue;

    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  readFilesAsDataURL(files: File[]): Promise<string[]> {
    return Promise.all(
      files.map(
        (f) =>
          new Promise<string>((res) => {
            const r = new FileReader();
            r.onload = (e) => res(e.target!.result as string);
            r.readAsDataURL(f);
          }),
      ),
    );
  }

  setFilter(type: 'status' | 'priority', value: string): void {
    if (type === 'status') this.activeStatus = value;
    else this.activePriority = value;
  }

  clearFilter(type: 'status' | 'priority'): void {
    if (type === 'status') this.activeStatus = 'all';
    else this.activePriority = 'all';
  }

  filteredTasks(status: 'todo' | 'inprogress' | 'done'): Task[] {
    let list = this.tasks.filter((t) => {
      const matchSearch =
        !this.activeSearch ||
        t.title.toLowerCase().includes(this.activeSearch.toLowerCase()) ||
        t.description.toLowerCase().includes(this.activeSearch.toLowerCase());
      const matchStatus = this.activeStatus === 'all' || t.status === this.activeStatus;
      const matchPriority = this.activePriority === 'all' || t.priority === this.activePriority;
      return matchSearch && matchStatus && matchPriority && t.status === status;
    });
    return this.applySortOrder(list);
  }

  get searchResults(): Task[] {
    if (!this.activeSearch) return [];
    const q = this.activeSearch.toLowerCase();
    return this.tasks.filter(
      (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    );
  }

  get sortedPreview(): Task[] {
    if (this.activeSort === 'none') return [];
    return this.applySortOrder([...this.tasks]);
  }

  get activeSortLabel(): string {
    switch (this.activeSort) {
      case 'created':
        return 'Date Created';
      case 'title':
        return 'Title (A–Z)';
      case 'priority':
        return 'Priority';
      default:
        return '';
    }
  }

  private applySortOrder(list: Task[]): Task[] {
    if (this.activeSort === 'created')
      return list.sort(
        (a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime(),
      );
    if (this.activeSort === 'title') return list.sort((a, b) => a.title.localeCompare(b.title));
    if (this.activeSort === 'priority') {
      const rank: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
      return list.sort((a, b) => rank[b.priority] - rank[a.priority]);
    }
    return list;
  }

  highlight(text: string): string {
    if (!this.activeSearch) return text;
    const escaped = this.activeSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
  }

  applySort(): void {
    this.activeSort = this.sortSelectValue;
  }
  clearSort(): void {
    this.activeSort = 'none';
    this.sortSelectValue = 'none';
  }

  onDragStart(taskId: string): void {
    this.draggedTaskId = taskId;
  }
  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, status: 'todo' | 'inprogress' | 'done'): void {
    event.preventDefault();
    if (!this.draggedTaskId) return;
    const t = this.tasks.find((t) => t.id === this.draggedTaskId);
    if (t && t.status !== status) {
      t.status = status;
      this.saveTasks();
    }
    this.draggedTaskId = null;
  }

  toggleExpand(task: Task): void {
    task.expanded = !task.expanded;
  }

  openEditModal(id: string): void {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;
    this.editingTaskId = id;
    this.editTitle = task.title;
    this.editDesc = task.description;
    this.editPriority = task.priority;
    this.editDeadline = task.deadline || '';
    this.editFiles = [];
    this.editCurrentImages = [...(task.attachments || [])];
    this.showEditModal = true;
    if (this.showTaskModule) {
      this.closeTaskModule();
    }
  }

  onEditFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      const currentCount = this.editCurrentImages.length;
      const maxAllowed = 5 - currentCount;

      if (files.length > maxAllowed) {
        alert(`You can only add ${maxAllowed} more image(s). Maximum 5 total.`);
        this.editFiles = files.slice(0, maxAllowed);
      } else {
        this.editFiles = files;
      }
    }
  }

  async saveEdit(): Promise<void> {
    if (!this.editingTaskId) return;
    const task = this.tasks.find((t) => t.id === this.editingTaskId);
    if (!task) return;

    if (this.isDuplicate(this.editTitle.trim(), this.editingTaskId)) {
      alert('Duplicate title!');
      return;
    }

    task.title = this.editTitle.trim();
    task.description = this.editDesc.trim();
    task.priority = this.editPriority;
    task.deadline = this.editDeadline ? this.editDeadline : null;

    if (this.editFiles.length) {
      const currentCount = task.attachments?.length || 0;
      const maxAllowed = 5 - currentCount;

      if (maxAllowed > 0) {
        const filesToAdd = this.editFiles.slice(0, maxAllowed);
        const addedImages = await this.readFilesAsDataURL(filesToAdd);
        task.attachments = [...(task.attachments || []), ...addedImages];
      } else {
        alert('Maximum 5 images already reached. Remove some images first.');
      }
    } else {
      task.attachments = [...this.editCurrentImages];
    }

    this.saveTasks();
    this.closeEditModal();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingTaskId = null;
    this.editFiles = [];
    if (this.editFileInputRef?.nativeElement) {
      this.editFileInputRef.nativeElement.value = '';
    }
  }

  removeEditImage(i: number): void {
    this.editCurrentImages.splice(i, 1);
  }

  openDeleteModal(id: string): void {
    this.pendingDeleteId = id;
    this.showDeleteModal = true;
    if (this.showTaskModule) {
      this.closeTaskModule();
    }
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.pendingDeleteId = null;
  }

  confirmDelete(): void {
    if (this.pendingDeleteId) {
      this.tasks = this.tasks.filter((t) => t.id !== this.pendingDeleteId);
      this.saveTasks();
    }
    this.cancelDelete();
  }

  moveTask(id: string, status: 'todo' | 'inprogress' | 'done'): void {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.status = status;
      this.saveTasks();
    }
    this.closeTaskModule();
  }

  openLightbox(taskId: string, index: number): void {
    this.lightTaskId = taskId;
    this.lightIndex = index;
    this.showLightbox = true;
  }

  closeLightbox(): void {
    this.showLightbox = false;
    this.lightTaskId = null;
  }

  get lightboxImages(): string[] {
    return this.tasks.find((t) => t.id === this.lightTaskId)?.attachments || [];
  }

  lightboxNav(dir: number): void {
    const imgs = this.lightboxImages;
    this.lightIndex = Math.max(0, Math.min(imgs.length - 1, this.lightIndex + dir));
  }

  deleteLightboxImage(): void {
    const task = this.tasks.find((t) => t.id === this.lightTaskId);
    if (!task) return;
    task.attachments.splice(this.lightIndex, 1);
    this.saveTasks();
    if (task.attachments.length === 0) this.closeLightbox();
    else this.lightIndex = Math.min(this.lightIndex, task.attachments.length - 1);
  }

  removeThumb(taskId: string, index: number): void {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      task.attachments.splice(index, 1);
      this.saveTasks();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    const modals = [
      { isOpen: this.showLightbox, close: () => this.closeLightbox() },
      { isOpen: this.showTaskModule, close: () => this.closeTaskModule() },
      { isOpen: this.showEditModal, close: () => this.closeEditModal() },
      { isOpen: this.showDeleteModal, close: () => this.cancelDelete() },
    ];
    const activeModal = modals.find((m) => m.isOpen);
    if (activeModal) activeModal.close();
  }
}
