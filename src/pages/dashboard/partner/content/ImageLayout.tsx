import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Upload } from 'lucide-react';

const ImageLayout = () => {
  const imageSections = [
    { id: 1, name: 'Hero Background - Home', type: 'Background Image', dimension: '1920x1080', lastUpdated: '2024-01-20' },
    { id: 2, name: 'Common Parallax Background', type: 'Parallax Image', dimension: '1920x600', lastUpdated: '2024-01-18' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Image and Layout Management</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage your website background images and layout assets.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Image Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dimension</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imageSections.map((section) => (
                <TableRow key={section.id}>
                  <TableCell className="font-medium">{section.name}</TableCell>
                  <TableCell>{section.type}</TableCell>
                  <TableCell>{section.dimension}</TableCell>
                  <TableCell>{section.lastUpdated}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-1" />
                        Replace
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageLayout;
