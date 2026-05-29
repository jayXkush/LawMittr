import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Star, Briefcase, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Lawyer } from '@/types/lawyer';

interface LawyerCardProps {
  lawyer: Lawyer;
  index?: number;
}

export function LawyerCard({ lawyer, index = 0 }: LawyerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-lg">{lawyer.name}</CardTitle>
              {lawyer.city && (
                <p className="mt-1 flex items-center gap-1 text-sm text-[var(--color-muted-foreground)]">
                  <MapPin className="h-3.5 w-3.5" />
                  {lawyer.city}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-[var(--color-accent)]/15 px-2 py-1 text-sm font-semibold">
              <Star className="h-4 w-4 fill-[var(--color-accent)] text-[var(--color-accent)]" />
              {lawyer.rating.toFixed(1)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {lawyer.specialization.slice(0, 3).map((spec) => (
              <Badge key={spec}>{spec}</Badge>
            ))}
          </div>
          <div className="mb-4 space-y-1 text-sm text-[var(--color-muted-foreground)]">
            <p className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              {lawyer.experience} years experience
            </p>
            <p className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              ₹{lawyer.consultationFee} / session
            </p>
          </div>
          <Link to={`/lawyers/${lawyer.userId}`} className="mt-auto">
            <Button className="w-full" variant="default">
              View Profile & Book
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
