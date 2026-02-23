import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AddAllergyDialog({ open, onOpenChange, form, onFormChange, onSave }) {
  const handleChange = (field, value) => {
    onFormChange((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px] max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Allergy</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="allergen-name">Allergen Name</Label>
              <Input
                id="allergen-name"
                placeholder="Search and select allergen..."
                value={form.allergen}
                onChange={(e) => handleChange('allergen', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adverse-event">Adverse Event Description</Label>
              <Select value={form.adverseEvent} onValueChange={(value) => handleChange('adverseEvent', value)}>
                <SelectTrigger id="adverse-event">
                  <SelectValue placeholder="Select Adverse Event Description" />
                </SelectTrigger>
                <SelectContent>
                  {['Rash', 'Swelling', 'Anaphylaxis', 'GI upset'].map((item) => (
                    <SelectItem key={item} value={item.toLowerCase().replace(/\s+/g, '-')}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select value={form.severity} onValueChange={(value) => handleChange('severity', value)}>
                <SelectTrigger id="severity">
                  <SelectValue placeholder="Select Severity" />
                </SelectTrigger>
                <SelectContent>
                  {['Mild', 'Moderate', 'Severe'].map((item) => (
                    <SelectItem key={item} value={item.toLowerCase()}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reaction">Reaction</Label>
              <Select value={form.reaction} onValueChange={(value) => handleChange('reaction', value)}>
                <SelectTrigger id="reaction">
                  <SelectValue placeholder="Select Reaction" />
                </SelectTrigger>
                <SelectContent>
                  {['Hives', 'Itching', 'Anaphylaxis', 'Nausea'].map((item) => (
                    <SelectItem key={item} value={item.toLowerCase()}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="onset">Onset</Label>
              <Select value={form.onset} onValueChange={(value) => handleChange('onset', value)}>
                <SelectTrigger id="onset">
                  <SelectValue placeholder="Select Onset" />
                </SelectTrigger>
                <SelectContent>
                  {['Immediate', 'Delayed', 'Unknown'].map((item) => (
                    <SelectItem key={item} value={item.toLowerCase()}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="onset-date">Onset Date</Label>
              <Input
                id="onset-date"
                type="date"
                placeholder="Select date"
                value={form.onsetDate}
                onChange={(e) => handleChange('onsetDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                placeholder="Select date"
                value={form.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Has allergy been updated?</Label>
              <Select value={form.updated} onValueChange={(value) => handleChange('updated', value)}>
                <SelectTrigger id="allergy-updated">
                  <SelectValue placeholder="Yes / No" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Has the red allergy been applied?</Label>
              <Select value={form.redApplied} onValueChange={(value) => handleChange('redApplied', value)}>
                <SelectTrigger id="red-allergy">
                  <SelectValue placeholder="Yes / No" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="active">Active</Label>
              <Select value={form.active} onValueChange={(value) => handleChange('active', value)}>
                <SelectTrigger id="active">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="allergy-comment">Comment</Label>
              <Input
                id="allergy-comment"
                placeholder="Add comment"
                className="max-w-xl"
                value={form.comment}
                onChange={(e) => handleChange('comment', e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button onClick={onSave} className="w-full sm:w-auto">
            Save Allergy
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


