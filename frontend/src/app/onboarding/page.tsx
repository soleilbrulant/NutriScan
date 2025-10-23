'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Icons } from '@/components/ui/icons';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface FormData {
  age: string;
  gender: string;
  height: string;
  weight: string;
  activityLevel: string;
  goalType: string;
}

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    age: '',
    gender: '',
    height: '',
    weight: '',
    activityLevel: '',
    goalType: '',
  });

  const { firebaseUser, checkProfile } = useAuth();
  const router = useRouter();

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return formData.age !== '' && formData.gender !== '';
      case 2:
        return formData.height !== '' && formData.weight !== '';
      case 3:
        return formData.activityLevel !== '' && formData.goalType !== '';
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handlePrevious = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(step) || !firebaseUser) {
      toast.error('Please complete all fields');
      return;
    }

    setLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          age: parseInt(formData.age),
          gender: formData.gender,
          height: parseFloat(formData.height),
          weight: parseFloat(formData.weight),
          activityLevel: formData.activityLevel,
          goalType: formData.goalType,
        }),
      });

      if (response.ok) {
        await checkProfile();
        toast.success('Profile created successfully!');
        router.push('/');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create profile');
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.user className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Tell us about yourself</h2>
              <p className="text-gray-600 mt-2">This helps us personalize your experience</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="age" className="text-sm font-medium text-gray-700">
                  Age *
                </Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter your age"
                  value={formData.age}
                  onChange={(e) => updateFormData('age', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                  Gender *
                </Label>
                <Select value={formData.gender} onValueChange={(value) => updateFormData('gender', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.weight className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Your measurements</h2>
              <p className="text-gray-600 mt-2">We need this to calculate your nutrition goals</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="height" className="text-sm font-medium text-gray-700">
                  Height (cm) *
                </Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="e.g., 175"
                  value={formData.height}
                  onChange={(e) => updateFormData('height', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
                  Weight (kg) *
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 70.5"
                  value={formData.weight}
                  onChange={(e) => updateFormData('weight', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Your goals</h2>
              <p className="text-gray-600 mt-2">Let's set up your nutrition targets</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="activityLevel" className="text-sm font-medium text-gray-700">
                  Activity Level *
                </Label>
                <Select value={formData.activityLevel} onValueChange={(value) => updateFormData('activityLevel', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
                    <SelectItem value="lightly_active">Light (light exercise 1-3 days/week)</SelectItem>
                    <SelectItem value="moderately_active">Moderate (moderate exercise 3-5 days/week)</SelectItem>
                    <SelectItem value="very_active">Active (hard exercise 6-7 days/week)</SelectItem>
                    <SelectItem value="extra_active">Very Active (very hard exercise, physical job)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="goalType" className="text-sm font-medium text-gray-700">
                  Goal *
                </Label>
                <Select value={formData.goalType} onValueChange={(value) => updateFormData('goalType', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose">Lose Weight</SelectItem>
                    <SelectItem value="maintain">Maintain Weight</SelectItem>
                    <SelectItem value="gain">Gain Weight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mb-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-600 mt-2">
                Step {step} of {totalSteps}
              </p>
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Complete Your Profile
            </CardTitle>
            <CardDescription className="text-gray-600">
              Just a few details to get started
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="min-h-[300px]">
              {renderStep()}
            </div>

            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex-1"
                  disabled={loading}
                >
                  Previous
                </Button>
              )}
              
              {step < totalSteps ? (
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  disabled={!validateStep(step)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  disabled={loading || !validateStep(step)}
                >
                  {loading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Creating Profile...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 