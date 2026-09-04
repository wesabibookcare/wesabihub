import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { trainingEngine } from '../../engines/TrainingEngine';
import { Course } from '../../types';
import { GraduationCap, Plus, Trash2, Edit, Archive, History } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export const TrainingAcademyPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Partial<Course>>({});

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const data = await trainingEngine.getAllCourses();
    setCourses(data);
    setLoading(false);
  };

  const handleSave = async () => {
      await trainingEngine.saveCourse(currentCourse as any, 'admin');
      setIsEditing(false);
      setCurrentCourse({});
      fetchCourses();
  }

  const handleDelete = async (id: string) => {
      await trainingEngine.deleteCourse(id, 'admin');
      fetchCourses();
  }

  return (
    <AdminLayout>
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <GraduationCap className="text-primary-600" />
            Training Academy Management
          </h1>
          <Button className="rounded-xl" onClick={() => setIsEditing(true)}>
            <Plus size={16} className="mr-2" /> Create New Course
          </Button>
        </div>

        {isEditing && (
            <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
                <h2 className="text-lg font-bold">{currentCourse.id ? 'Edit Course' : 'Create Course'}</h2>
                <input type="text" placeholder="Title" value={currentCourse.title || ''} onChange={e => setCurrentCourse({...currentCourse, title: e.target.value})} className="w-full p-2 border rounded" />
                <textarea placeholder="Description" value={currentCourse.description || ''} onChange={e => setCurrentCourse({...currentCourse, description: e.target.value})} className="w-full p-2 border rounded" />
                <input type="text" placeholder="Category" value={currentCourse.category || ''} onChange={e => setCurrentCourse({...currentCourse, category: e.target.value})} className="w-full p-2 border rounded" />
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={currentCourse.isMandatory || false} onChange={e => setCurrentCourse({...currentCourse, isMandatory: e.target.checked})} />
                    Mandatory
                </label>
                <div className="flex gap-2">
                    <Button onClick={handleSave}>Save</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
            </Card>
        )}

        <Card className="p-6 border-slate-200 dark:border-slate-800">
          <div className="space-y-4">
            {courses.map(course => (
              <div key={course.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{course.title}</h3>
                  <p className="text-sm text-slate-900">{course.description}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge>{course.category}</Badge>
                    {course.isMandatory && <Badge variant="error">Mandatory</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setCurrentCourse(course); setIsEditing(true); }}><Edit size={16} /></Button>
                  <Button variant="outline" size="sm"><Archive size={16} /></Button>
                  <Button variant="outline" size="sm" className="text-rose-600" onClick={() => handleDelete(course.id)}><Trash2 size={16} /></Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};
