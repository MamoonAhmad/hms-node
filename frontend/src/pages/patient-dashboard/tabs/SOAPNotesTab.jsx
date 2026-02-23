import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Eye, Edit, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { ClinicalNotesModal } from './components/ClinicalNotesModal';
import { Badge } from '@/components/ui/badge';

// Static data
const clinicalNotes = [
  {
    id: 1,
    date: '2025-01-20',
    provider: 'Dr. Sarah Smith',
    noteType: 'SOAP Note',
    encounterDate: '2025-01-20',
    encounterTime: '10:30',
    visitType: 'OPD',
    addendums: [
      {
        id: 1,
        text: 'Patient called back to report improvement in symptoms. Continue current treatment.',
        addedBy: 'Dr. Sarah Smith',
        dateTime: '2025-01-21T14:30:00',
      },
    ],
  },
  {
    id: 2,
    date: '2025-01-15',
    provider: 'Dr. John Williams',
    noteType: 'SOAP Note',
    encounterDate: '2025-01-15',
    encounterTime: '14:00',
    visitType: 'Follow-up',
    addendums: [],
  },
];

export function SOAPNotesTab({ patient }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [notes, setNotes] = useState(clinicalNotes);
  const [expandedNotes, setExpandedNotes] = useState(new Set());

  const handleAddNote = () => {
    setSelectedNote(null);
    setIsModalOpen(true);
  };

  const handleEditNote = (note) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  const handleViewNote = (note) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  const handleAddAddendum = (note) => {
    const addendumNote = {
      ...note,
      isAddendum: true,
      parentNoteId: note.id,
    };
    setSelectedNote(addendumNote);
    setIsModalOpen(true);
  };

  const toggleNoteExpansion = (noteId) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  const handleSaveNote = (noteData) => {
    if (selectedNote?.isAddendum) {
      // Add addendum to existing note
      setNotes(
        notes.map((n) =>
          n.id === selectedNote.parentNoteId
            ? {
                ...n,
                addendums: [
                  ...(n.addendums || []),
                  {
                    id: Date.now(),
                    text: noteData.addendumText || noteData.subjective || '',
                    addedBy: noteData.provider || 'Current User',
                    dateTime: new Date().toISOString(),
                  },
                ],
              }
            : n
        )
      );
    } else if (selectedNote) {
      // Update existing note
      setNotes(notes.map((n) => (n.id === selectedNote.id ? { ...n, ...noteData } : n)));
    } else {
      // Add new note
      const newNote = {
        id: Date.now(),
        ...noteData,
        date: new Date().toISOString().split('T')[0],
        addendums: [],
      };
      setNotes([newNote, ...notes]);
    }
    setIsModalOpen(false);
    setSelectedNote(null);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Clinical Notes Management</h2>
        <Button onClick={handleAddNote} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Clinical Notes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clinical Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No clinical notes found
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">
                          {new Date(note.date).toLocaleDateString()} - {note.provider}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {note.noteType} | {note.visitType}
                        </p>
                      </div>
                      {note.addendums && note.addendums.length > 0 && (
                        <Badge variant="secondary">
                          {note.addendums.length} Addendum{note.addendums.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewNote(note)}
                        className="h-8 w-8 p-0"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditNote(note)}
                        className="h-8 w-8 p-0"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAddAddendum(note)}
                        className="h-8"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Add Addendum
                      </Button>
                      {note.addendums && note.addendums.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleNoteExpansion(note.id)}
                          className="h-8 w-8 p-0"
                          title={expandedNotes.has(note.id) ? "Collapse" : "Expand"}
                        >
                          {expandedNotes.has(note.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Addendums List */}
                  {expandedNotes.has(note.id) && note.addendums && note.addendums.length > 0 && (
                    <div className="border-t pt-3 space-y-2">
                      <p className="text-sm font-semibold">Addendums:</p>
                      {note.addendums.map((addendum) => (
                        <div
                          key={addendum.id}
                          className="bg-muted/50 p-3 rounded-lg border-l-4 border-blue-500"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">{addendum.addedBy}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(addendum.dateTime).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-sm">{addendum.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <ClinicalNotesModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNote(null);
        }}
        onSave={handleSaveNote}
        patient={patient}
        note={selectedNote}
      />
    </div>
  );
}
