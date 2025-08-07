import { useState } from "react";
import { Sliders, FlaskConical, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface GpsData {
  lat: number;
  lng: number;
  hdop: number;
}

interface TestScenario {
  lat: number;
  lng: number;
  hdop: number;
  description: string;
}

interface GpsControlsProps {
  gpsData: GpsData;
  onGpsDataChange: (data: GpsData) => void;
  testScenarios: TestScenario[];
}

export default function GpsControls({ gpsData, onGpsDataChange, testScenarios }: GpsControlsProps) {
  const [localGpsData, setLocalGpsData] = useState(gpsData);

  const handleInputChange = (field: keyof GpsData, value: string) => {
    const numericValue = parseFloat(value) || 0;
    const newData = { ...localGpsData, [field]: numericValue };
    setLocalGpsData(newData);
    onGpsDataChange(newData);
  };

  const handleScenarioClick = (scenario: TestScenario) => {
    const newData = {
      lat: scenario.lat,
      lng: scenario.lng,
      hdop: scenario.hdop
    };
    setLocalGpsData(newData);
    onGpsDataChange(newData);
  };

  return (
    <>
      {/* GPS Input Controls */}
      <Card data-testid="gps-controls">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Sliders className="text-blue-600 mr-2" size={16} />
            GPS Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="latitude" className="text-sm font-medium text-slate-700">
              Latitude
            </Label>
            <Input
              id="latitude"
              type="number"
              step="0.000001"
              min="-90"
              max="90"
              value={localGpsData.lat}
              onChange={(e) => handleInputChange('lat', e.target.value)}
              placeholder="Enter latitude (-90 to 90)"
              className="mt-1"
              data-testid="input-latitude"
            />
          </div>
          
          <div>
            <Label htmlFor="longitude" className="text-sm font-medium text-slate-700">
              Longitude
            </Label>
            <Input
              id="longitude"
              type="number"
              step="0.000001"
              min="-180"
              max="180"
              value={localGpsData.lng}
              onChange={(e) => handleInputChange('lng', e.target.value)}
              placeholder="Enter longitude (-180 to 180)"
              className="mt-1"
              data-testid="input-longitude"
            />
          </div>
          
          <div>
            <Label htmlFor="hdop" className="text-sm font-medium text-slate-700">
              HDOP Value
            </Label>
            <Input
              id="hdop"
              type="number"
              step="0.1"
              min="0"
              value={localGpsData.hdop}
              onChange={(e) => handleInputChange('hdop', e.target.value)}
              placeholder="Enter HDOP"
              className="mt-1"
              data-testid="input-hdop"
            />
            <p className="text-xs text-slate-500 mt-1">Lower values indicate better accuracy</p>
          </div>
          
          <Button 
            onClick={() => onGpsDataChange(localGpsData)}
            className="w-full flex items-center justify-center"
            data-testid="button-update-map"
          >
            <RotateCcw className="mr-2" size={16} />
            Update Map
          </Button>
        </CardContent>
      </Card>

      {/* Test Scenarios */}
      <Card data-testid="test-scenarios">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <FlaskConical className="text-blue-600 mr-2" size={16} />
            Test Scenarios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {testScenarios.map((scenario, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => handleScenarioClick(scenario)}
              className="w-full text-left p-3 h-auto hover:border-blue-300 hover:bg-blue-50 transition-all"
              data-testid={`button-scenario-${index}`}
            >
              <div className="w-full">
                <div className="font-medium text-slate-900">{scenario.description}</div>
                <div className="text-sm text-slate-500">
                  Lat: {scenario.lat}, Lng: {scenario.lng}, HDOP: {scenario.hdop}
                </div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
